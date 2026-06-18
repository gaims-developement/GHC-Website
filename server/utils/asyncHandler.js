const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    const routePath = `${req.method} ${req.originalUrl || 'unknown'}`;
    console.error(`[ASYNC_ERROR] [${routePath}]`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    error.routePath = routePath;
    next(error);
  });
};

module.exports = asyncHandler;
