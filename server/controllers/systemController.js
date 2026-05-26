const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const execFileAsync = promisify(execFile);

const health = asyncHandler(async (_req, res) => {
  const started = Date.now();
  let dbStatus = 'down';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'ok';
  } catch {
    dbStatus = 'down';
  }

  const smtpStatus = process.env.SMTP_HOST ? 'configured' : 'not configured';

  res.json({
    db: dbStatus,
    api: 'ok',
    payment: process.env.RAZORPAY_KEY_ID ? 'configured' : 'missing keys',
    smtp: smtpStatus,
    storage: process.env.CLOUDINARY_NAME ? 'cloudinary configured' : 'local uploads',
    memory: {
      usedMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      totalMb: Math.round(os.totalmem() / 1024 / 1024),
    },
    cpu: {
      cores: os.cpus().length,
      load: os.loadavg(),
    },
    latencyMs: Date.now() - started,
  });
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
  const dbName = process.env.DB_NAME || 'ghc_db';
  try {
    const { stdout } = await execFileAsync('mysqldump', [
      '-h', process.env.DB_HOST || 'localhost',
      '-u', process.env.DB_USER || 'root',
      `-p${process.env.DB_PASSWORD || ''}`,
      dbName,
    ]);
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
