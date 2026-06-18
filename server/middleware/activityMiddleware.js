const ActivityLog = require('../models/activityLogModel');

const moduleFromPath = (path = '') => {
  const segment = path.split('/').filter(Boolean)[0] || 'cms';
  return segment.replace(/[^a-z0-9_-]/gi, '');
};

const actionFromMethod = (method) => {
  if (method === 'POST') return 'record_creation';
  if (method === 'PUT' || method === 'PATCH') return 'record_update';
  if (method === 'DELETE') return 'record_deletion';
  return null;
};

const trackMutations = async (req, res, next) => {
  const action = actionFromMethod(req.method);
  if (!action) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    ActivityLog.logActivity({
      userId: req.user?.id || null,
      action,
      module: moduleFromPath(req.path),
      recordId: req.params?.id || req.body?.id || null,
      metadata: { method: req.method, path: req.originalUrl },
    }).catch(() => {});
  });

  return next();
};

module.exports = { trackMutations };
