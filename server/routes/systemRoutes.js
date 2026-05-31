const router = require('express').Router();
const { exportCsv, exportSql, health, launchChecklist } = require('../controllers/systemController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const { auditLog } = require('../middleware/productionMiddleware');

const canManageSystem = requireRole('SUPER_ADMIN', 'ADMIN', 'OPERATIONS');
const canBackup = requireRole('SUPER_ADMIN', 'ADMIN');

router.get('/system/health', health);
router.get('/system/launch-checklist', requireAuth, canManageSystem, launchChecklist);
router.get('/system/backup.csv', requireAuth, canBackup, auditLog('backup.csv'), exportCsv);
router.get('/system/backup.sql', requireAuth, canBackup, auditLog('backup.sql'), exportSql);

module.exports = router;
