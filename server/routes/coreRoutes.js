const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const controller = require('../controllers/coreController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});
const upload = multer({ storage, limits: { fileSize: Number(process.env.CORE_UPLOAD_LIMIT_MB || 30) * 1024 * 1024 } });

router.use(requireAuth);

router.get('/core/dashboard', requirePermission('manage_core_architecture'), controller.dashboard);
router.get('/core/search', requirePermission('manage_core_architecture'), controller.globalSearch);
router.get('/core/files', requirePermission('manage_files'), controller.files);
router.post('/core/files', requirePermission('manage_files'), upload.single('file'), controller.uploadFile);
router.get('/core/tags', requirePermission('manage_core_architecture'), controller.tags);
router.post('/core/tags', requirePermission('manage_core_architecture'), controller.tags);
router.post('/core/tags/attach', requirePermission('manage_core_architecture'), controller.attachTag);
router.get('/core/comments', requirePermission('manage_core_architecture'), controller.comments);
router.post('/core/comments', requirePermission('manage_core_architecture'), controller.comments);
router.get('/core/tasks', requirePermission('manage_tasks'), controller.tasks);
router.post('/core/tasks', requirePermission('manage_tasks'), controller.tasks);
router.put('/core/tasks/:id', requirePermission('manage_tasks'), controller.updateTask);
router.get('/core/approvals', requirePermission('manage_approvals'), controller.approvals);
router.post('/core/approvals', requirePermission('manage_approvals'), controller.approvals);
router.put('/core/approvals/:id/decision', requirePermission('manage_approvals'), controller.decideApproval);
router.get('/core/notifications', requirePermission('manage_core_architecture'), controller.notifications);
router.post('/core/notifications', requirePermission('manage_core_architecture'), controller.notifications);
router.get('/core/settings', requirePermission('manage_core_architecture'), controller.settings);
router.put('/core/settings', requirePermission('manage_core_architecture'), controller.settings);
router.get('/core/events', requirePermission('manage_core_architecture'), controller.events);
router.post('/core/events', requirePermission('manage_core_architecture'), controller.events);
router.get('/core/reports.csv', requirePermission('view_global_reports', 'manage_core_architecture'), controller.reportCsv);

module.exports = router;
