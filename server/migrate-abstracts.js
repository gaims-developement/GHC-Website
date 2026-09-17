require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { pool } = require('./config/db');

async function migrate() {
  try {
    console.log('Starting migration to add columns to abstracts table...');
    
    const queries = [
      "ALTER TABLE abstracts ADD COLUMN city_state VARCHAR(255);",
      "ALTER TABLE abstracts ADD COLUMN specialty VARCHAR(100);",
      "ALTER TABLE abstracts ADD COLUMN year_of_study VARCHAR(50);",
      "ALTER TABLE abstracts ADD COLUMN declaration_url TEXT;"
    ];

    for (const query of queries) {
      try {
        await pool.query(query);
        console.log('Executed:', query);
      } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('Column already exists, skipping:', query);
        } else {
          console.error('Error executing', query, err.message);
        }
      }
    }
    
    console.log('Migration complete.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
