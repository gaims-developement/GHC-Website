const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { initializeDatabase } = require('./config/schema');
initializeDatabase().then(() => {
  console.log("FINISHED RUNNING setup");
}).catch(err => {
  console.error("SETUP REJECTED WITH:", err);
});
