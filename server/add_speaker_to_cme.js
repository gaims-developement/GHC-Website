require('dotenv').config();
const { pool } = require('./config/db');

async function run() {
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM cme_records LIKE 'speaker_id'");
    if (columns.length === 0) {
      await pool.query('ALTER TABLE cme_records ADD COLUMN speaker_id INT NULL');
    }
    console.log('Success');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
