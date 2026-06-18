const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const { analytics, registrations, revenue } = require('../controllers/analyticsController');
const { listCheckins, scan } = require('../controllers/checkinController');
const {
  bulkGenerate,
  dashboard: certificateDashboard,
  downloadCertificate,
  duplicateTemplate,
  generateCertificate,
  listAccreditation,
  listCertificates,
  listSignatures,
  listTemplates,
  reports: certificateReports,
  resendCertificate,
  revokeCertificate,
  saveAccreditation,
  saveField,
  saveSignature,
  saveTemplate,
  verifyCertificate,
} = require('../controllers/certificateController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const canViewAnalytics = requirePermission('analytics.view');
const canScan = requirePermission('manage_checkins', 'checkin.scan');
const canManageCertificates = requirePermission('certificates.manage', 'manage_certificates');
const canGenerateCertificates = requirePermission('generate_certificates', 'certificates.manage', 'manage_certificates');
const canManageTemplates = requirePermission('manage_templates', 'certificates.manage');
const canManageSignatures = requirePermission('manage_signatures', 'certificates.manage');
const canManageAccreditation = requirePermission('manage_accreditation', 'certificates.manage');
const canViewCertificateReports = requirePermission('view_certificate_reports', 'certificates.manage');
const canRevokeCertificates = requirePermission('revoke_certificates', 'certificates.manage');

const certificateUploadDir = path.join(__dirname, '..', 'uploads', 'certificates');
fs.mkdirSync(certificateUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, certificateUploadDir),
  filename: (_req, file, cb) => cb(null, `certificate-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'].includes(file.mimetype)),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024) },
});

router.get('/analytics', requireAuth, canViewAnalytics, analytics);
router.get('/analytics/revenue', requireAuth, canViewAnalytics, revenue);
router.get('/analytics/registrations', requireAuth, canViewAnalytics, registrations);

router.get('/checkin', requireAuth, canScan, listCheckins);
router.post('/checkin/scan', requireAuth, canScan, scan);

router.get('/certificates/verify', verifyCertificate);
router.get('/certificates/dashboard', requireAuth, canManageCertificates, certificateDashboard);
router.get('/certificates/templates', requireAuth, canManageTemplates, listTemplates);
router.post('/certificates/templates', requireAuth, canManageTemplates, upload.single('background'), saveTemplate);
router.put('/certificates/templates/:id', requireAuth, canManageTemplates, upload.single('background'), saveTemplate);
router.post('/certificates/templates/:id/duplicate', requireAuth, canManageTemplates, duplicateTemplate);
router.post('/certificates/fields', requireAuth, canManageTemplates, saveField);
router.get('/certificates/signatures', requireAuth, canManageSignatures, listSignatures);
router.post('/certificates/signatures', requireAuth, canManageSignatures, upload.single('signature'), saveSignature);
router.put('/certificates/signatures/:id', requireAuth, canManageSignatures, upload.single('signature'), saveSignature);
router.get('/certificates/accreditation', requireAuth, canManageAccreditation, listAccreditation);
router.post('/certificates/accreditation', requireAuth, canManageAccreditation, saveAccreditation);
router.get('/certificates/reports', requireAuth, canViewCertificateReports, certificateReports);
router.post('/certificates/generate', requireAuth, canGenerateCertificates, generateCertificate);
router.post('/certificates/bulk', requireAuth, canGenerateCertificates, bulkGenerate);
router.patch('/certificates/:id/revoke', requireAuth, canRevokeCertificates, revokeCertificate);
router.post('/certificates/:id/resend', requireAuth, canManageCertificates, resendCertificate);
router.get('/certificates', requireAuth, canManageCertificates, listCertificates);
router.get('/certificates/:id/pdf', requireAuth, canManageCertificates, downloadCertificate);

module.exports = router;
