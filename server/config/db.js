const mysql = require('mysql2/promise');

// Required Aiven database environment variables:
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.
// The pool below is created once by Node's module cache and reused everywhere.
const requiredDatabaseEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

const validateDatabaseEnv = () => {
  const missing = requiredDatabaseEnv.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required database environment variable(s): ${missing.join(', ')}`);
  }

  if (!Number.isFinite(Number(process.env.DB_PORT))) {
    throw new Error('Invalid database environment variable: DB_PORT must be a number');
  }
};

validateDatabaseEnv();

const databaseConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Aiven requires encrypted MySQL connections. Certificate verification is
  // disabled here because Aiven-managed CA chains can vary by environment.
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = mysql.createPool({
  ...databaseConfig,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✓ Connected to Aiven Database');
  } catch (error) {
    console.error('Failed to connect to Aiven Database');
    console.error({
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      message: error.message,
    });
    throw error;
  }
};

const closePool = async () => {
  await pool.end();
};

module.exports = {
  closePool,
  databaseConfig,
  pool,
  requiredDatabaseEnv,
  testConnection,
  validateDatabaseEnv,
};
