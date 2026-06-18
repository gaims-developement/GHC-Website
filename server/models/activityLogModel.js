const { pool } = require('../config/db');

const logActivity = async ({ userId = null, action, module = null, recordId = null, metadata = null }) => {
  if (!action) return;

  await pool.query(
    'INSERT INTO activity_logs (user_id, action, module, record_id, metadata) VALUES (?, ?, ?, ?, ?)',
    [userId, action, module, recordId, metadata ? JSON.stringify(metadata) : null]
  );
};

const list = async ({ limit = 50 } = {}) => {
  const [rows] = await pool.query(
    `SELECT activity_logs.id, activity_logs.user_id, users.name AS user_name, activity_logs.action,
            activity_logs.module, activity_logs.record_id, activity_logs.metadata, activity_logs.timestamp
     FROM activity_logs
     LEFT JOIN users ON users.id = activity_logs.user_id
     ORDER BY activity_logs.timestamp DESC
     LIMIT ?`,
    [Number(limit)]
  );

  return rows;
};

module.exports = { list, logActivity };
