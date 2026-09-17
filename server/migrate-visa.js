require('dotenv').config({ path: 'C:/Users/Sushmit/Desktop/GAIMS National Stuff/GHC/ghc-website/server/.env' });
const schema = require('C:/Users/Sushmit/Desktop/GAIMS National Stuff/GHC/ghc-website/server/config/schema.js');

async function run() {
  try {
    await schema.createVisaTables();
    console.log('Visa tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run();
