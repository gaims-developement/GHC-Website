const { execFile } = require('child_process');
const { promisify } = require('util');
const { databaseConfig, pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const execFileAsync = promisify(execFile);

const HEALTHCHECK_DB_TIMEOUT_MS = Number(process.env.HEALTHCHECK_DB_TIMEOUT_MS || 2000);

const formatUptime = (seconds) => {
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null,
    `${remainingSeconds}s`,
  ].filter(Boolean).join(' ');
};

const queryWithTimeout = (queryPromise, timeoutMs) => {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Database health check timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([queryPromise, timeoutPromise]).finally(() => clearTimeout(timeout));
};

/**
 * Public uptime monitor endpoint.
 *
 * Configure external monitors such as UptimeRobot or Better Stack to send an
 * HTTP GET request to:
 *   https://<backend-domain>/api/system/health
 *
 * Expected behavior:
 *   - HTTP 200 means the API is up and MySQL answered a lightweight SELECT 1.
 *   - HTTP 503 means the API process is reachable, but database connectivity failed.
 *
 * Keep this endpoint unauthenticated, fast, and lightweight so it can be called
 * frequently by uptime monitoring and keep-alive services.
 */
const health = asyncHandler(async (_req, res) => {
  try {
    await queryWithTimeout(
      pool.query({ sql: 'SELECT 1 AS healthcheck', timeout: HEALTHCHECK_DB_TIMEOUT_MS }),
      HEALTHCHECK_DB_TIMEOUT_MS
    );

    return res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('System health check failed');
    console.error({
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
    });

    return res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message || 'Database health check failed',
      timestamp: new Date().toISOString(),
      uptime: formatUptime(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    });
  }
});

const exportCsv = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT r.registration_id, r.full_name, r.email, r.payment_status, r.registration_status, t.name AS ticket
    FROM registrations r
    LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
    ORDER BY r.created_at DESC
  `);
  const header = ['registration_id', 'full_name', 'email', 'ticket', 'payment_status', 'registration_status'];
  const csv = [header, ...rows.map((row) => header.map((key) => row[key]))]
    .map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-export.csv"');
  res.send(csv);
});

const exportSql = asyncHandler(async (_req, res) => {
  const dbName = databaseConfig.database;
  const dumpArgs = [
    '-h', databaseConfig.host,
    '-P', String(databaseConfig.port),
    '-u', databaseConfig.user,
    '--ssl-mode=REQUIRED',
  ];

  try {
    const { stdout } = await execFileAsync('mysqldump', [...dumpArgs, dbName], {
      env: {
        ...process.env,
        MYSQL_PWD: databaseConfig.password,
      },
    });
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${dbName}.sql"`);
    return res.send(stdout);
  } catch {
    const [tables] = await pool.query('SHOW TABLES');
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${dbName}-schema.sql"`);
    return res.send(`-- mysqldump unavailable. Tables:\n${tables.map((row) => `-- ${Object.values(row)[0]}`).join('\n')}\n`);
  }
});

const launchChecklist = asyncHandler(async (_req, res) => {
  const [[payments]] = await pool.query("SELECT COUNT(*) AS count FROM payments WHERE status = 'paid'");
  const [[tickets]] = await pool.query('SELECT COUNT(*) AS count FROM ticket_types WHERE active = TRUE');
  const [[research]] = await pool.query('SELECT COUNT(*) AS count FROM abstracts');
  const [[certificates]] = await pool.query('SELECT COUNT(*) AS count FROM certificates WHERE issued = TRUE');

  res.json({
    items: [
      { id: 'payments', label: 'Payments', complete: Boolean(process.env.RAZORPAY_KEY_ID) || Number(payments.count) > 0 },
      { id: 'smtp', label: 'SMTP', complete: Boolean(process.env.SMTP_HOST) },
      { id: 'seo', label: 'SEO', complete: true },
      { id: 'tickets', label: 'Tickets', complete: Number(tickets.count) > 0 },
      { id: 'research', label: 'Research', complete: Number(research.count) > 0 },
      { id: 'certificates', label: 'Certificates', complete: Number(certificates.count) > 0 },
      { id: 'deploy', label: 'Deploy', complete: Boolean(process.env.APP_URL && process.env.CLIENT_URLS) },
      { id: 'analytics', label: 'Analytics', complete: Boolean(process.env.GA_MEASUREMENT_ID) },
    ],
  });
});

module.exports = { exportCsv, exportSql, health, launchChecklist };
