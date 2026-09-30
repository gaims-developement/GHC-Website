const { pool } = require('../config/db');

const subscribe = async (email) => {
  // Use ON DUPLICATE KEY UPDATE to handle existing emails easily
  const [result] = await pool.query(
    `INSERT INTO newsletter_subscribers (email, status) 
     VALUES (?, 'active') 
     ON DUPLICATE KEY UPDATE status = 'active', updated_at = CURRENT_TIMESTAMP`,
    [email]
  );
  return result;
};

const unsubscribe = async (email) => {
  const [result] = await pool.query(
    `UPDATE newsletter_subscribers SET status = 'unsubscribed' WHERE email = ?`,
    [email]
  );
  return result;
};

const listSubscribers = async () => {
  const [rows] = await pool.query(
    `SELECT id, email, status, subscribed_at, updated_at
     FROM newsletter_subscribers
     ORDER BY subscribed_at DESC, id DESC`
  );
  return rows;
};

module.exports = {
  subscribe,
  unsubscribe,
  listSubscribers,
};
