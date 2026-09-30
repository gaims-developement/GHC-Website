const router = require('express').Router();
const { subscribe, listSubscribers } = require('../controllers/newsletterController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

router.post('/subscribe', subscribe);
router.get(
  '/subscribers',
  requireAuth,
  requirePermission('manage_system', 'view_system_reports', 'manage_settings'),
  listSubscribers
);

module.exports = router;
