const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const limit = (value, fallback = 50) => Math.min(Math.max(Number(value) || fallback, 1), 200);

const writeAudit = async (req, action, module, recordType = null, recordId = null, oldValues = null, newValues = null) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user?.id || null,
      action,
      module,
      recordType,
      recordId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      req.ip || req.socket?.remoteAddress || null,
      req.headers['user-agent'] || null,
    ]
  );
};

const queryCount = async (sql, params = []) => {
  const [[row]] = await pool.query(sql, params);
  return Number(row?.count || 0);
};

const dashboard = asyncHandler(async (_req, res) => {
  const [dbPing] = await pool.query('SELECT 1 AS ok');
  const [cloudinaryAssets] = await pool.query('SELECT COUNT(*) AS count FROM media_assets');
  const [[emails]] = await pool.query(`
    SELECT
      SUM(status = 'sent') AS sent,
      SUM(status = 'failed') AS failed,
      SUM(status = 'queued') AS queued
    FROM email_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `);
  const [recentAuditLogs] = await pool.query(`
    SELECT audit_logs.*, users.name AS user_name
    FROM audit_logs
    LEFT JOIN users ON users.id = audit_logs.user_id
    ORDER BY audit_logs.created_at DESC
    LIMIT 12
  `);
  const [securityAlerts] = await pool.query(`
    SELECT * FROM system_notifications
    WHERE is_active = TRUE AND type IN ('warning','critical')
    ORDER BY created_at DESC
    LIMIT 8
  `);

  const failedLogins = await queryCount("SELECT COUNT(*) AS count FROM login_logs WHERE status = 'failed' AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)");
  const healthScore = Math.max(50, 100 - (failedLogins > 10 ? 10 : 0) - (Number(emails.failed || 0) > 0 ? 10 : 0) - (securityAlerts.length * 5));

  res.json({
    totals: {
      users: await queryCount('SELECT COUNT(*) AS count FROM users'),
      activeUsers: await queryCount('SELECT COUNT(*) AS count FROM users WHERE is_active = TRUE'),
      onlineUsers: await queryCount('SELECT COUNT(*) AS count FROM active_sessions WHERE expires_at IS NULL OR expires_at > NOW()'),
      failedLogins,
      auditLogs: await queryCount('SELECT COUNT(*) AS count FROM audit_logs'),
    },
    statuses: {
      database: dbPing?.length ? 'healthy' : 'warning',
      api: 'healthy',
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'not configured',
      email: Number(emails.failed || 0) ? 'warning' : (process.env.SMTP_HOST ? 'healthy' : 'not configured'),
      cloudinaryAssets: Number(cloudinaryAssets?.count || 0),
    },
    emailSummary: emails,
    securityAlerts,
    recentAuditLogs,
    healthScore,
  });
});

const auditLogs = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT audit_logs.*, users.name AS user_name, users.email AS user_email
     FROM audit_logs
     LEFT JOIN users ON users.id = audit_logs.user_id
     ORDER BY audit_logs.created_at DESC
     LIMIT ?`,
    [limit(req.query.limit)]
  );
  res.json({ logs: rows });
});

const loginLogs = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT login_logs.*, users.name AS user_name
     FROM login_logs
     LEFT JOIN users ON users.id = login_logs.user_id
     ORDER BY login_logs.created_at DESC
     LIMIT ?`,
    [limit(req.query.limit)]
  );
  res.json({ logs: rows });
});

const sessions = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT active_sessions.id, active_sessions.user_id, active_sessions.ip_address, active_sessions.device,
      active_sessions.last_activity, active_sessions.expires_at, users.name AS user_name, users.email
    FROM active_sessions
    INNER JOIN users ON users.id = active_sessions.user_id
    WHERE active_sessions.expires_at IS NULL OR active_sessions.expires_at > NOW()
    ORDER BY active_sessions.last_activity DESC
  `);
  res.json({ sessions: rows });
});

const terminateSession = asyncHandler(async (req, res) => {
  const [[session]] = await pool.query('SELECT * FROM active_sessions WHERE id = ?', [req.params.id]);
  await pool.query('DELETE FROM active_sessions WHERE id = ?', [req.params.id]);
  await writeAudit(req, 'terminated_session', 'system', 'active_session', req.params.id, session, null);
  res.json({ success: true });
});

const apiMonitoring = asyncHandler(async (_req, res) => {
  const [[summary]] = await pool.query(`
    SELECT COUNT(*) AS requests, AVG(duration_ms) AS average_ms, SUM(status_code >= 400) AS errors
    FROM api_request_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `);
  const [recent] = await pool.query('SELECT * FROM api_request_logs ORDER BY created_at DESC LIMIT 50');
  res.json({ summary, recent });
});

const databaseMonitoring = asyncHandler(async (_req, res) => {
  const [tables] = await pool.query(`
    SELECT TABLE_NAME AS name, TABLE_ROWS AS rows_count, ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) AS size_mb
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    LIMIT 40
  `);
  const [[connections]] = await pool.query("SHOW STATUS LIKE 'Threads_connected'");
  res.json({ status: 'healthy', connections: Number(connections?.Value || 0), tables });
});

const cloudinaryMonitoring = asyncHandler(async (_req, res) => {
  const [assets] = await pool.query(`
    SELECT resource_type, COUNT(*) AS count, ROUND(SUM(size_bytes) / 1024 / 1024, 2) AS size_mb
    FROM media_assets
    GROUP BY resource_type
  `);
  res.json({ configured: Boolean(process.env.CLOUDINARY_CLOUD_NAME), cloudName: process.env.CLOUDINARY_CLOUD_NAME || null, assets });
});

const emailMonitoring = asyncHandler(async (_req, res) => {
  const [[summary]] = await pool.query("SELECT SUM(status = 'sent') AS sent, SUM(status = 'failed') AS failed, SUM(status = 'queued') AS queued FROM email_logs");
  const [logs] = await pool.query('SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 60');
  res.json({ summary, logs });
});

const notifications = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM system_notifications ORDER BY created_at DESC LIMIT 100');
    return res.json({ notifications: rows });
  }
  const { title, message, type = 'info', isActive = true } = req.body;
  const [result] = await pool.query(
    'INSERT INTO system_notifications (title, message, type, is_active) VALUES (?, ?, ?, ?)',
    [title, message, type, isActive]
  );
  await writeAudit(req, 'created_notification', 'system', 'system_notification', result.insertId, null, req.body);
  return res.status(201).json({ id: result.insertId });
});

const backups = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM backup_records ORDER BY created_at DESC LIMIT 100');
    return res.json({ backups: rows });
  }
  const name = `manual-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
  const [result] = await pool.query(
    'INSERT INTO backup_records (backup_name, file_location, size, status) VALUES (?, ?, ?, ?)',
    [name, `/api/system/backup.sql`, 0, 'available']
  );
  await writeAudit(req, 'created_backup_record', 'system', 'backup_record', result.insertId, null, { backupName: name });
  return res.status(201).json({ id: result.insertId, backupName: name });
});

const featureFlags = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM feature_flags ORDER BY feature_name ASC');
    return res.json({ flags: rows });
  }
  const { featureName, description = '', isEnabled = false } = req.body;
  await pool.query(
    `INSERT INTO feature_flags (feature_name, description, is_enabled)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE description = VALUES(description), is_enabled = VALUES(is_enabled)`,
    [featureName, description, isEnabled]
  );
  await writeAudit(req, 'saved_feature_flag', 'system', 'feature_flag', featureName, null, req.body);
  return res.json({ success: true });
});

const maintenance = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [[row]] = await pool.query('SELECT * FROM maintenance_mode ORDER BY id DESC LIMIT 1');
    return res.json({ maintenance: row || { enabled: false, message: '' } });
  }
  const { enabled = false, message = '' } = req.body;
  await pool.query('INSERT INTO maintenance_mode (enabled, message, enabled_by, enabled_at) VALUES (?, ?, ?, IF(?, NOW(), NULL))', [enabled, message, req.user?.id || null, enabled]);
  await writeAudit(req, enabled ? 'enabled_maintenance' : 'disabled_maintenance', 'system', 'maintenance_mode', null, null, req.body);
  return res.json({ success: true });
});

const users = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query(`
      SELECT users.id, users.name, users.email, users.phone, users.is_active, users.is_locked, users.force_password_reset, users.created_at, roles.name AS role
      FROM users
      LEFT JOIN roles ON roles.id = users.role_id
      ORDER BY users.created_at DESC
    `);
    return res.json({ users: rows });
  }
  const [[before]] = await pool.query('SELECT id, is_active, is_locked, force_password_reset FROM users WHERE id = ?', [req.params.id]);
  await pool.query('UPDATE users SET is_active = ?, is_locked = ?, force_password_reset = ? WHERE id = ?', [
    req.body.isActive,
    req.body.isLocked,
    req.body.forcePasswordReset,
    req.params.id,
  ]);
  await writeAudit(req, 'updated_user_security', 'system', 'user', req.params.id, before, req.body);
  return res.json({ success: true });
});

const roles = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [roleRows] = await pool.query('SELECT * FROM roles ORDER BY name ASC');
    const [permissionRows] = await pool.query('SELECT * FROM permissions ORDER BY `key` ASC');
    const [rolePermissions] = await pool.query(`
      SELECT role_permissions.role_id, permissions.key
      FROM role_permissions
      INNER JOIN permissions ON permissions.id = role_permissions.permission_id
    `);
    const byRole = rolePermissions.reduce((acc, row) => ({ ...acc, [row.role_id]: [...(acc[row.role_id] || []), row.key] }), {});
    return res.json({ roles: roleRows.map((role) => ({ ...role, permissions: byRole[role.id] || [] })), permissions: permissionRows });
  }
  const { name } = req.body;
  const [result] = await pool.query('INSERT INTO roles (name) VALUES (?)', [name]);
  await writeAudit(req, 'created_role', 'system', 'role', result.insertId, null, req.body);
  return res.status(201).json({ id: result.insertId });
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const permissionKeys = Array.from(new Set((Array.isArray(req.body.permissions) ? req.body.permissions : []).filter(Boolean)));
  const [[role]] = await pool.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
  const [permissions] = permissionKeys.length ? await pool.query('SELECT id, `key` FROM permissions WHERE `key` IN (?)', [permissionKeys]) : [[]];
  await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
  if (permissions.length) {
    await pool.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [permissions.map((permission) => [Number(req.params.id), permission.id])]);
  }
  await writeAudit(req, 'updated_role_permissions', 'system', 'role', req.params.id, role, { permissions: permissionKeys });
  res.json({ success: true });
});

const security = asyncHandler(async (_req, res) => {
  const [failed] = await pool.query("SELECT * FROM login_logs WHERE status = 'failed' ORDER BY created_at DESC LIMIT 40");
  const [alerts] = await pool.query("SELECT * FROM system_notifications WHERE type IN ('warning','critical') ORDER BY created_at DESC LIMIT 40");
  res.json({ failedLogins: failed, alerts });
});

const settings = asyncHandler(async (_req, res) => {
  res.json({
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      appUrl: process.env.APP_URL || null,
      smtpConfigured: Boolean(process.env.SMTP_HOST),
      cloudinaryConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      jwtConfigured: Boolean(process.env.JWT_SECRET),
    },
  });
});

module.exports = {
  apiMonitoring,
  auditLogs,
  backups,
  cloudinaryMonitoring,
  dashboard,
  databaseMonitoring,
  emailMonitoring,
  featureFlags,
  loginLogs,
  maintenance,
  notifications,
  roles,
  security,
  sessions,
  settings,
  terminateSession,
  updateRolePermissions,
  users,
};
