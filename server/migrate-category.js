require('dotenv').config({ path: 'C:/Users/Sushmit/Desktop/GAIMS National Stuff/GHC/ghc-website/server/.env' });
const { pool } = require('C:/Users/Sushmit/Desktop/GAIMS National Stuff/GHC/ghc-website/server/config/db.js');

async function migrate() {
  try {
    console.log('Altering category ENUM...');
    await pool.query("ALTER TABLE abstracts MODIFY COLUMN category ENUM('poster', 'oral', 'research_paper', 'case_report') DEFAULT 'poster'");
    console.log('Successfully updated category ENUM');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
