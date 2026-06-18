const DEFAULT_CLIENT_URLS = [
  'https://globalhealthconclave.netlify.app',
  'https://www.globalhealthconclave.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

const getEnvOrigins = () => {
  const envVars = [
    process.env.CLIENT_URLS,
    process.env.CLIENT_URL,
    process.env.CORS_ORIGIN,
    process.env.CORS_ORIGINS,
    process.env.ALLOWED_ORIGINS,
    process.env.ALLOWED_ORIGIN,
  ];
  const origins = [];
  for (const envVal of envVars) {
    if (envVal) {
      envVal.split(',').forEach((val) => {
        const trimmed = val.trim();
        if (trimmed) origins.push(trimmed);
      });
    }
  }
  return origins;
};

const configuredClientUrls = getEnvOrigins();
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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  optionsSuccessStatus: 204,
};

module.exports = {
  CLIENT_URLS,
  corsOptions,
};
