const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

async function migrate() {
  console.log('Creating committees table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS committees (
      id INT AUTO_INCREMENT PRIMARY KEY,
      slug VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      display_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  console.log('Modifying committee_members.committee_type to VARCHAR(100)...');
  await pool.query(`
    ALTER TABLE committee_members 
    MODIFY COLUMN committee_type VARCHAR(100) NOT NULL DEFAULT 'organising'
  `);

  const [rows] = await pool.query('SELECT COUNT(*) as count FROM committees');
  if (rows[0].count === 0) {
    console.log('Seeding default committees...');
    await pool.query(`
      INSERT INTO committees (slug, name, display_order) VALUES
      ('organising', 'Organising Committee', 1),
      ('jury', 'Jury Board', 2),
      ('scientific', 'Scientific Committee', 3)
    `);
  }

  const [committees] = await pool.query('SELECT * FROM committees ORDER BY display_order ASC');
  console.log('Current committees in database:');
  console.log(JSON.stringify(committees, null, 2));
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
