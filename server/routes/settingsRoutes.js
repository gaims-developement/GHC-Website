const router = require('express').Router();
const { getSettings, getPublicSettings, updateSettings } = require('../controllers/settingsController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const canManageSettings = requirePermission('settings.manage');

router.get('/public', getPublicSettings);
router.get('/', requireAuth, canManageSettings, getSettings);
router.put('/', requireAuth, canManageSettings, updateSettings);

module.exports = router;
