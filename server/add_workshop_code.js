require('dotenv').config();
const { pool } = require('./config/db');

async function run() {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM workshops LIKE 'workshop_code'");
    if (columns.length === 0) {
      await pool.query('ALTER TABLE workshops ADD COLUMN workshop_code VARCHAR(100) NULL');
      console.log('Added workshop_code column.');
    } else {
      console.log('workshop_code column already exists.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
