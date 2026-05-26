require('dotenv').config();

const { pool } = require('../config/db');
const { initializeDatabase } = require('../config/schema');

initializeDatabase()
  .then(async () => {
    console.log('Seed complete');
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
