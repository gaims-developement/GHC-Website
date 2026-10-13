const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { getJwtSecret } = require('../config/jwt');

// Nomination documents are loaded by <iframe>/<img>, which cannot send an Authorization header.
const QUERY_TOKEN_PATH = /\/nominations\/\d+\/documents\//;

const getToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies?.token) return req.cookies.token;
  const pathOnly = String(req.originalUrl || '').split('?')[0];
  return QUERY_TOKEN_PATH.test(pathOnly) ? req.query?.token : undefined;
};

// Only admin access tokens are accepted here; mobile and refresh tokens share the signing key.
const verifyAccessToken = (token) => {
  const payload = jwt.verify(token, getJwtSecret());
  if (!payload?.id || payload.type) throw new Error('Not an access token');
  return payload;
};

const ACCOUNT_STATE_TTL_MS = 60 * 1000;
const accountStateCache = new Map();

// Deactivated or locked accounts lose access within a minute instead of at token expiry.
const isAccountUsable = async (userId) => {
  const cached = accountStateCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.usable;

  const [[user]] = await pool.query('SELECT is_active, is_locked FROM users WHERE id = ? LIMIT 1', [userId]);
  const usable = Boolean(user) && user.is_active !== 0 && user.is_active !== false && user.is_locked !== 1 && user.is_locked !== true;
  accountStateCache.set(userId, { usable, expiresAt: Date.now() + ACCOUNT_STATE_TTL_MS });
  return usable;
};

const requireAuth = async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    if (!(await isAccountUsable(payload.id))) {
      return res.status(401).json({ message: 'Account is inactive' });
    }
  } catch (error) {
    return next(error);
  }

  req.user = payload;
  return next();
};

const optionalAuth = (req, _res, next) => {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = null;
  }

  return next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: 'Insufficient role permissions' });
  }

  return next();
};

const { rolePermissionMap } = require('../config/schema');

const requirePermission = (...permissions) => (req, res, next) => {
  if (req.user?.role === 'SUPER_ADMIN') {
    return next();
  }

  const rolePermissions = (rolePermissionMap && req.user?.role ? rolePermissionMap[req.user.role] : null) || [];
  const userPermissions = [...new Set([...(req.user?.permissions || []), ...rolePermissions])];
  const allowed = permissions.some((permission) => userPermissions.includes(permission));

  if (!allowed) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  return next();
};

module.exports = { optionalAuth, requireAuth, requirePermission, requireRole };
