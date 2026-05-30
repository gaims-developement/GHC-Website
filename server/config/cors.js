const DEFAULT_CLIENT_URLS = [
  'https://globalhealthconclave.netlify.app',
  'https://www.globalhealthconclave.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const configuredClientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const CLIENT_URLS = [...new Set([...DEFAULT_CLIENT_URLS, ...configuredClientUrls])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || CLIENT_URLS.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS origin not allowed: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

module.exports = {
  CLIENT_URLS,
  corsOptions,
};
