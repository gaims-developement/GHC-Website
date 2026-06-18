const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const canManageSettings = requirePermission('settings.manage');

router.get('/', requireAuth, canManageSettings, getSettings);
router.put('/', requireAuth, canManageSettings, updateSettings);

module.exports = router;
