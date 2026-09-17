const { pool } = require('./config/db'); pool.query(\"SHOW COLUMNS FROM abstracts LIKE 'category'\").then(([rows]) => { console.log(rows); process.exit(0); }).catch(console.error);
