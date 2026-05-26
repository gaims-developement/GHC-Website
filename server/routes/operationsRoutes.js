const router = require('express').Router();
const { analytics, registrations, revenue } = require('../controllers/analyticsController');
const { listCheckins, scan } = require('../controllers/checkinController');
const { downloadCertificate, generateCertificate, listCertificates } = require('../controllers/certificateController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const canViewAnalytics = requireRole('SUPER_ADMIN', 'ADMIN', 'OPERATIONS');
const canScan = requireRole('SUPER_ADMIN', 'ADMIN', 'VOLUNTEER', 'CHECKIN', 'OPERATIONS');
const canManageCertificates = requireRole('SUPER_ADMIN', 'ADMIN', 'OPERATIONS');

router.get('/analytics', requireAuth, canViewAnalytics, analytics);
router.get('/analytics/revenue', requireAuth, canViewAnalytics, revenue);
router.get('/analytics/registrations', requireAuth, canViewAnalytics, registrations);

router.get('/checkin', requireAuth, canScan, listCheckins);
router.post('/checkin/scan', requireAuth, canScan, scan);

router.post('/certificates/generate', requireAuth, canManageCertificates, generateCertificate);
router.get('/certificates', requireAuth, canManageCertificates, listCertificates);
router.get('/certificates/:id/pdf', requireAuth, canManageCertificates, downloadCertificate);

module.exports = router;
