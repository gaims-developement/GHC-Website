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

module.exports = {
  subscribe,
  unsubscribe,
};
