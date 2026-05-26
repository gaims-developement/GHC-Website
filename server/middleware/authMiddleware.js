const jwt = require('jsonwebtoken');

const getToken = (req) => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.token;
};

const requireAuth = (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const optionalAuth = (req, _res, next) => {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
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

const requirePermission = (...permissions) => (req, res, next) => {
  const userPermissions = req.user?.permissions || [];
  const allowed = permissions.some((permission) => userPermissions.includes(permission));

  if (!allowed) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  return next();
};

module.exports = { optionalAuth, requireAuth, requirePermission, requireRole };
