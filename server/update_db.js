require('dotenv').config();
const { pool } = require('./config/db');

async function updateDb() {
  try {
    await pool.query(`
      ALTER TABLE abstracts 
      ADD COLUMN revision_token VARCHAR(255),
      ADD COLUMN revision_token_expires DATETIME,
      ADD COLUMN current_version INT DEFAULT 1;
    `);
    console.log("Columns added successfully");
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Columns already exist");
    } else {
      console.error("Error adding columns:", e.message);
    }
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abstract_versions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        abstract_id INT NOT NULL,
        version_number INT NOT NULL,
        pdf_url VARCHAR(255) NOT NULL,
        declaration_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE
      )
    `);
    console.log("Abstract versions table created successfully");
  } catch (e) {
    console.error("Error creating versions table:", e.message);
  }

  process.exit(0);
}

updateDb();
