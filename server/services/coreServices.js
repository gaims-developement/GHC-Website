const { pool } = require('../config/db');
const { uploadToCloudinary } = require('./cloudinaryService');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;

const parseJson = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const logActivity = async ({ userId = null, action, module = null, recordId = null, metadata = null }) => {
  if (!action) return null;
  await pool.query(
    'INSERT INTO activity_logs (user_id, action, module, record_id, metadata) VALUES (?, ?, ?, ?, ?)',
    [userId, action, module, recordId, metadata ? JSON.stringify(metadata) : null]
  );
  return true;
};

const logAudit = async ({ userId = null, action, module = null, recordType = null, recordId = null, oldValues = null, newValues = null, ipAddress = null, userAgent = null }) => {
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, action, module, recordType, recordId, oldValues ? JSON.stringify(oldValues) : null, newValues ? JSON.stringify(newValues) : null, ipAddress, userAgent]
  );
};

const saveFile = async ({ file, module, entityType = null, entityId = null, uploadedBy = null, eventId = null, metadata = null }) => {
  const uploaded = await uploadToCloudinary(file.path, module || 'core', { resourceType: 'auto', transform: false });
  const [result] = await pool.query(
    `INSERT INTO files (module, entity_type, entity_id, file_name, file_type, cloudinary_public_id, file_url, uploaded_by, event_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [module || 'core', entityType, entityId, file.originalname, file.mimetype, uploaded.public_id, uploaded.secure_url, uploadedBy, eventId, metadata ? JSON.stringify(metadata) : null]
  );
  await logActivity({ userId: uploadedBy, action: 'uploaded_file', module, recordId: String(result.insertId), metadata: { entityType, entityId } });
  return { id: result.insertId, url: uploaded.secure_url, publicId: uploaded.public_id };
};

const queueNotification = async ({ recipientId = null, title, message, channel = 'in_app', module = null }) => {
  const [notification] = await pool.query(
    'INSERT INTO notifications (recipient_id, title, message, channel, status, module) VALUES (?, ?, ?, ?, ?, ?)',
    [recipientId, title, message, channel, 'queued', module]
  );
  await pool.query(
    'INSERT INTO notification_events (notification_id, source_module, recipient_id, title, message, channel, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [notification.insertId, module, recipientId, title, message, channel, 'queued']
  );
  return notification.insertId;
};

const search = async (query, limit = 8) => {
  const clean = `%${String(query || '').trim()}%`;
  if (clean === '%%') return [];
  const [sources] = await pool.query('SELECT * FROM core_search_sources WHERE is_active = TRUE ORDER BY module ASC');
  const results = [];
  for (const source of sources) {
    const subtitle = source.subtitle_column ? `, ${source.subtitle_column} AS subtitle` : ', NULL AS subtitle';
    const [rows] = await pool.query(
      `SELECT id, ${source.title_column} AS title ${subtitle}
       FROM ${source.table_name}
       WHERE ${source.title_column} LIKE ? ${source.subtitle_column ? `OR ${source.subtitle_column} LIKE ?` : ''}
       ORDER BY id DESC
       LIMIT ?`,
      source.subtitle_column ? [clean, clean, Number(limit)] : [clean, Number(limit)]
    );
    rows.forEach((row) => results.push({ ...row, module: source.module, route: source.route_template }));
  }
  return results.slice(0, Number(limit) * 4);
};

module.exports = { logActivity, logAudit, parseJson, queueNotification, saveFile, search, slugify };
