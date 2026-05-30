const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

const envResult = dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });
if (envResult.parsed) {
  console.log(`Loaded ${Object.keys(envResult.parsed).length} variable(s) from server/.env`);
} else if (envResult.error && envResult.error.code !== 'ENOENT') {
  console.warn(`Unable to load server/.env: ${envResult.error.message}`);
}

const { closePool, testConnection } = require('./config/db');
const { initializeDatabase } = require('./config/schema');
const { corsOptions } = require('./config/cors');
const apiRoutes = require('./routes');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter, csrfProtection, sanitizeBody } = require('./middleware/productionMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use((req, _res, next) => {
  console.log(`Incoming Origin: ${req.get('origin') || '(none)'}`);
  next();
});
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);
app.use('/api', sanitizeBody);
app.use('/api', csrfProtection);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    name: 'Global Healthcare Conclave API',
    status: 'running',
    version: '1.0.0',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use(notFound);
app.use(errorHandler);

let server;

const startServer = async () => {
  await testConnection();
  await initializeDatabase();
  server = app.listen(PORT, () => {
    console.log(`GHC API listening on port ${PORT}`);
  });
};

const shutdown = async (signal) => {
  console.log(`${signal} received. Closing server and database pool...`);
  if (!server) {
    try {
      await closePool();
    } finally {
      process.exit(0);
    }
  }

  server.close(async () => {
    try {
      await closePool();
      console.log('Database pool closed');
      process.exit(0);
    } catch (error) {
      console.error('Error while closing database pool');
      console.error(error);
      process.exit(1);
    }
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer().catch(async (error) => {
  console.error('Server startup failed');
  console.error(error.message);
  try {
    await closePool();
  } finally {
    process.exit(1);
  }
});
