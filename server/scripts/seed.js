require('dotenv').config();

const { closePool } = require('../config/db');
const { initializeDatabase } = require('../config/schema');

initializeDatabase()
  .then(async () => {
    console.log('Seed complete');
    await closePool();
  })
  .catch(async (error) => {
    console.error(error.message);
    await closePool();
    process.exit(1);
  });
