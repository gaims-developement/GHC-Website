require('dotenv').config();
const { pool } = require('./config/db');

async function main() {
  await pool.query("DELETE FROM email_logs WHERE status = 'failed'");
  console.log('Cleared failed emails');
  process.exit(0);
}
main();
