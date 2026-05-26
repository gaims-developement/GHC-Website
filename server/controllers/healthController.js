const { pool } = require('../config/db');

const getHealth = async (req, res) => {
  let database = 'unavailable';

  try {
    await pool.query('SELECT 1');
    database = 'available';
  } catch (error) {
    database = error.message;
  }

  res.json({
    status: 'ok',
    service: 'ghc-api',
    database,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
