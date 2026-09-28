const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  closeWorkshop,
  confirmWorkshopRegistration,
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshops,
  publishWorkshop,
  reorderWorkshops,
  updateWorkshop,
  workshopStats,
} = require('../controllers/workshopController');
const {
  publicApply,
  publicGetApplicationStatus,
  getDashboardStats,
  listApplications,
  getApplication,
  verifyGhcPass,
  confirmApplication,
  rejectApplication,
  resendConfirmationEmail,
  markAttendance,
  issueCertificate,
  getReports,
} = require('../controllers/workshopApplicationController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

const workshopUploadDir = path.join(__dirname, '..', 'uploads', 'workshops');
fs.mkdirSync(workshopUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, workshopUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `workshop-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024) },
});

const canManageWorkshops = requirePermission('manage_workshops', 'workshops.manage');
const canViewApplications = requirePermission('workshop_application_view', 'manage_workshops', 'workshops.manage');
const canVerifyApplications = requirePermission('workshop_application_verify', 'manage_workshops', 'workshops.manage');
const canConfirmApplications = requirePermission('workshop_application_confirm', 'manage_workshops', 'workshops.manage');
const canRejectApplications = requirePermission('workshop_application_reject', 'manage_workshops', 'workshops.manage');
const canManageAttendance = requirePermission('workshop_attendance_manage', 'manage_workshops', 'workshops.manage');
const canManageCertificates = requirePermission('workshop_certificate_manage', 'manage_workshops', 'workshops.manage');
const canViewReports = requirePermission('workshop_reports_view', 'manage_workshops', 'workshops.manage');

// 1. Public Routes
router.get('/', optionalAuth, listWorkshops);
router.post('/applications', publicApply);
router.post('/apply', publicApply);
router.post('/:id/apply', publicApply);
router.get('/applications/status', publicGetApplicationStatus);
router.get('/applications/lookup', publicGetApplicationStatus);

// 2. Protected Workshop Application Endpoints (MUST be before /:slug)
router.get('/stats', requireAuth, canViewApplications, getDashboardStats);
router.get('/applications/stats', requireAuth, canViewApplications, getDashboardStats);
router.get('/applications', requireAuth, canViewApplications, listApplications);
router.get('/applications/:id', requireAuth, canViewApplications, getApplication);
router.post('/applications/:id/verify-pass', requireAuth, canVerifyApplications, verifyGhcPass);
router.post('/applications/:id/verify-ghc', requireAuth, canVerifyApplications, verifyGhcPass);
router.post('/applications/:id/confirm', requireAuth, canConfirmApplications, confirmApplication);
router.post('/applications/:id/reject', requireAuth, canRejectApplications, rejectApplication);
router.post('/applications/:id/resend-email', requireAuth, canConfirmApplications, resendConfirmationEmail);
router.post('/applications/:id/attendance', requireAuth, canManageAttendance, markAttendance);
router.post('/applications/:id/certificate', requireAuth, canManageCertificates, issueCertificate);

// 3. Reports & Stats
router.get('/reports', requireAuth, canViewReports, getReports);

// 4. Workshop Admin CRUD & Details
router.post('/', requireAuth, canManageWorkshops, upload.single('image'), createWorkshop);
router.patch('/reorder', requireAuth, canManageWorkshops, reorderWorkshops);
router.patch('/:id/publish', requireAuth, canManageWorkshops, publishWorkshop);
router.patch('/:id/close', requireAuth, canManageWorkshops, closeWorkshop);
router.put('/:id', requireAuth, canManageWorkshops, upload.single('image'), updateWorkshop);
router.delete('/:id', requireAuth, canManageWorkshops, deleteWorkshop);
router.post('/:id/register-confirmed', optionalAuth, confirmWorkshopRegistration);

// 5. Dynamic Slug (Always at the end)
router.get('/:slug', optionalAuth, getWorkshop);

module.exports = router;
