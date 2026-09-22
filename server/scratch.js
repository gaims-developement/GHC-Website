require('dotenv').config();
const { pool } = require('./config/db.js');

async function alterDb() {
  try {
    console.log("Altering abstracts table...");
    await pool.query('ALTER TABLE abstracts ADD COLUMN ai_percentage DECIMAL(5,2) DEFAULT NULL');
    console.log("Added ai_percentage");
  } catch (e) {
    console.log("Error or already exists (ai_percentage):", e.message);
  }

  try {
    await pool.query('ALTER TABLE abstracts ADD COLUMN plagiarism_percentage DECIMAL(5,2) DEFAULT NULL');
    console.log("Added plagiarism_percentage");
  } catch (e) {
    console.log("Error or already exists (plagiarism_percentage):", e.message);
  }

  console.log("Done.");
  process.exit(0);
}

alterDb();
