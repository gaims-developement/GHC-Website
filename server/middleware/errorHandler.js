const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const routePath = error.routePath || req.originalUrl || 'unknown';

  console.error(`[ERROR] [${req.method} ${routePath}]`, {
    message: error.message || 'Internal server error',
    statusCode,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

module.exports = { notFound, errorHandler };
