const DEFAULT_CLIENT_URLS = [
  'https://globalhealthconclave.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const CLIENT_URLS = (process.env.CLIENT_URLS || process.env.CLIENT_URL || DEFAULT_CLIENT_URLS.join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || CLIENT_URLS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  optionsSuccessStatus: 204,
};

module.exports = {
  CLIENT_URLS,
  corsOptions,
};
