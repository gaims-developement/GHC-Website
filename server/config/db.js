const dns = require('dns').promises;
const mysql = require('mysql2/promise');

const requiredDatabaseEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
let poolInstance;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const isRailwayRuntime = () =>
  Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_ENVIRONMENT_ID ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.RAILWAY_SERVICE_ID
  );

const getSafeDatabaseEnv = () => ({
  DB_HOST: process.env.DB_HOST || '(undefined)',
  DB_PORT: process.env.DB_PORT || '(undefined)',
  DB_USER: process.env.DB_USER || '(undefined)',
  DB_NAME: process.env.DB_NAME || '(undefined)',
});

const printDatabaseDiagnostics = () => {
  const safeEnv = getSafeDatabaseEnv();

  console.log('Database startup diagnostics');
  console.log(`DB_HOST=${safeEnv.DB_HOST}`);
  console.log(`DB_PORT=${safeEnv.DB_PORT}`);
  console.log(`DB_USER=${safeEnv.DB_USER}`);
  console.log(`DB_NAME=${safeEnv.DB_NAME}`);
  console.log(`Railway runtime detected=${isRailwayRuntime() ? 'yes' : 'no'}`);
};

const validateDatabaseEnv = () => {
  const missing = requiredDatabaseEnv.filter((name) => isBlank(process.env[name]));

  if (missing.length > 0) {
    const source = isRailwayRuntime()
      ? 'Railway configuration issue: add the missing variables to the Railway service Variables tab.'
      : 'Missing environment variable: define these variables in your runtime environment or local .env file.';

    throw new Error(`${source} Missing required database environment variable(s): ${missing.join(', ')}`);
  }

  const port = Number(process.env.DB_PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid database environment variable: DB_PORT must be an integer from 1 to 65535');
  }
};

const getDatabaseConfig = () => {
  validateDatabaseEnv();

  return {
    host: process.env.DB_HOST.trim(),
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER.trim(),
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME.trim(),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
    queueLimit: 0,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 15000),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true',
    },
  };
};

const databaseConfig = new Proxy(
  {},
  {
    get(_target, property) {
      return getDatabaseConfig()[property];
    },
    ownKeys() {
      return Reflect.ownKeys(getDatabaseConfig());
    },
    getOwnPropertyDescriptor(_target, property) {
      return {
        enumerable: true,
        configurable: true,
        value: getDatabaseConfig()[property],
      };
    },
  }
);

const getPool = () => {
  if (!poolInstance) {
    poolInstance = mysql.createPool(getDatabaseConfig());
  }

  return poolInstance;
};

const pool = new Proxy(
  {},
  {
    get(_target, property) {
      const value = getPool()[property];
      return typeof value === 'function' ? value.bind(getPool()) : value;
    },
  }
);

const resolveDatabaseHost = async () => {
  validateDatabaseEnv();
  const host = process.env.DB_HOST.trim();

  try {
    const addresses = await dns.lookup(host, { all: true });
    console.log(`Database DNS resolved: ${host} -> ${addresses.map((entry) => entry.address).join(', ')}`);
    return addresses;
  } catch (error) {
    console.error('Database DNS resolution failed');
    console.error({
      host,
      code: error.code,
      message: error.message,
      diagnosis:
        error.code === 'ENOTFOUND'
          ? 'Invalid host, Railway DNS/network issue, or Aiven DNS issue. Verify DB_HOST exactly matches the Aiven service host.'
          : 'Unable to resolve DB_HOST before opening a MySQL connection.',
    });
    throw error;
  }
};

const logDatabaseConnectionError = (error) => {
  const message = error.message || '';
  let diagnosis = 'Database connection failed. Check the database host, port, credentials, SSL mode, and network access.';

  if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
    diagnosis =
      'DNS resolution failure: DB_HOST could not be resolved. This usually means an invalid host, Railway DNS/network issue, or temporary Aiven DNS issue.';
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.errno === 1045) {
    diagnosis = 'Authentication failure: DB_USER or DB_PASSWORD is incorrect for this Aiven MySQL service.';
  } else if (
    error.code === 'HANDSHAKE_SSL_ERROR' ||
    error.code === 'ERR_SSL_TLSV1_ALERT_UNKNOWN_CA' ||
    /ssl|tls|certificate|handshake/i.test(message)
  ) {
    diagnosis = 'SSL failure: Aiven requires SSL. The mysql2 pool is configured with SSL; check Aiven CA/certificate settings if this persists.';
  } else if (
    error.code === 'ETIMEDOUT' ||
    error.code === 'PROTOCOL_SEQUENCE_TIMEOUT' ||
    error.code === 'PROTOCOL_CONNECTION_LOST' ||
    /timeout/i.test(message)
  ) {
    diagnosis = 'Connection timeout: DB_HOST/DB_PORT may be wrong, the Aiven service may be unavailable, or Railway cannot reach the endpoint.';
  }

  console.error('Failed to connect to Aiven Database');
  console.error({
    code: error.code,
    errno: error.errno,
    sqlState: error.sqlState,
    message: error.message,
    diagnosis,
  });
};

const runDatabasePreflight = async () => {
  printDatabaseDiagnostics();
  validateDatabaseEnv();
  await resolveDatabaseHost();
};

const testConnection = async () => {
  try {
    await runDatabasePreflight();
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    console.log('Connected to Aiven Database with SSL enabled');
  } catch (error) {
    logDatabaseConnectionError(error);
    throw error;
  }
};

const closePool = async () => {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = undefined;
  }
};

module.exports = {
  closePool,
  databaseConfig,
  getDatabaseConfig,
  getPool,
  getSafeDatabaseEnv,
  isRailwayRuntime,
  pool,
  printDatabaseDiagnostics,
  requiredDatabaseEnv,
  resolveDatabaseHost,
  runDatabasePreflight,
  testConnection,
  validateDatabaseEnv,
};
