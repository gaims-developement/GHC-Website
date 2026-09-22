require('dotenv').config();
const { pool } = require('./config/db');

async function run() {
  try {
    await pool.query('ALTER TABLE cme_records MODIFY COLUMN session_id INT NULL');
    const [columns] = await pool.query("SHOW COLUMNS FROM cme_records LIKE 'session_name'");
    if (columns.length === 0) {
      await pool.query('ALTER TABLE cme_records ADD COLUMN session_name VARCHAR(255) NULL');
    }
    console.log('Success');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
