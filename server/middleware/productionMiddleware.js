const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { pool } = require('../config/db');

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.RATE_LIMIT_MAX || 300),
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
});

const sanitizeString = (value) => value
  .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  .replace(/javascript:/gi, '')
  .trim();

const sanitizeBody = (req, _res, next) => {
  const walk = (value) => {
    if (typeof value === 'string') return sanitizeString(value);
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, walk(item)]));
    }
    return value;
  };

  if (req.body && typeof req.body === 'object') req.body = walk(req.body);
  next();
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const token = req.cookies?.csrf_token || crypto.randomBytes(24).toString('hex');
    res.cookie('csrf_token', token, {
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return next();
  }

  if (process.env.CSRF_DISABLED === 'true') return next();
  if (!req.headers.authorization && !req.cookies?.token) return next();
  if (req.path.includes('/payments/verify')) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  if (cookieToken && headerToken && cookieToken === headerToken) return next();

  return res.status(403).json({ message: 'CSRF token missing or invalid' });
};

const auditLog = (action) => async (req, _res, next) => {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, metadata) VALUES (?, ?, ?)',
      [req.user?.id || null, action, JSON.stringify({ method: req.method, path: req.originalUrl, body: req.body || {} })]
    );
  } catch {
    // Audit logging must not block the operational path.
  }
  next();
};

module.exports = { apiLimiter, auditLog, authLimiter, csrfProtection, sanitizeBody };
