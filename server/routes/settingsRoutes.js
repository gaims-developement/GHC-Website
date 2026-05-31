const router = require('express').Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const canManageSettings = requireRole('SUPER_ADMIN', 'ADMIN');

router.get('/', requireAuth, canManageSettings, getSettings);
router.put('/', requireAuth, canManageSettings, updateSettings);

module.exports = router;
