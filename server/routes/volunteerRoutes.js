const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const { bulkStatus, checkIn, dashboard, list, publicSync, reports, save } = require('../controllers/volunteerController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'volunteers');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `volunteer-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => cb(null, [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ].includes(file.mimetype)),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024) },
});

router.get('/public/volunteers-sync', optionalAuth, publicSync);

router.use(requireAuth);
router.get('/volunteer-dashboard', requirePermission('manage_volunteers', 'view_volunteer_reports'), dashboard);
router.get('/volunteer-reports', requirePermission('view_volunteer_reports', 'manage_volunteers'), reports);

router.get('/volunteers', requirePermission('manage_volunteers', 'manage_recruitment'), list('volunteers'));
router.post('/volunteers', requirePermission('manage_volunteers', 'manage_recruitment'), upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'resume', maxCount: 1 }, { name: 'idCard', maxCount: 1 }]), save('volunteers'));
router.put('/volunteers/:id', requirePermission('manage_volunteers', 'manage_recruitment'), upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'resume', maxCount: 1 }, { name: 'idCard', maxCount: 1 }]), save('volunteers'));
router.patch('/volunteers/bulk-status', requirePermission('manage_recruitment', 'manage_volunteers'), bulkStatus);
router.post('/volunteers/:id/check-in', requirePermission('manage_attendance', 'manage_volunteers'), checkIn);

const routes = [
  ['volunteer-departments', 'departments', 'manage_volunteers'],
  ['volunteer-assignments', 'assignments', 'manage_volunteers'],
  ['shifts', 'shifts', 'manage_shifts'],
  ['shift-assignments', 'shiftAssignments', 'manage_shifts'],
  ['volunteer-attendance', 'attendance', 'manage_attendance'],
  ['performance-reviews', 'reviews', 'manage_volunteers'],
  ['volunteer-certificates', 'certificates', 'manage_certificates'],
  ['volunteer-announcements', 'announcements', 'manage_announcements'],
  ['volunteer-interviews', 'interviews', 'manage_interviews'],
  ['volunteer-tasks', 'tasks', 'manage_tasks'],
];

routes.forEach(([pathName, type, permission]) => {
  router.get(`/${pathName}`, requirePermission(permission, 'manage_volunteers'), list(type));
  router.post(`/${pathName}`, requirePermission(permission, 'manage_volunteers'), save(type));
  router.put(`/${pathName}/:id`, requirePermission(permission, 'manage_volunteers'), save(type));
});

module.exports = router;
