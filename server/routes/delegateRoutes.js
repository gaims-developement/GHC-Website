const router = require('express').Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { checkIn, importDelegates, listDelegates, sendConfirmation, sendWhatsappInvite, setAttendance, sponsorScan } = require('../controllers/delegateController');
const { exportVenueList, getIdDocument, getIdForm, listDelegateIds, previewCheckIn, reviewId, sendIdRequest, submitIdForm } = require('../controllers/delegateIdController');
const { requireAuth, requirePermission, requireRole } = require('../middleware/authMiddleware');

// Delegates and attendance are restricted to Super Admin and Admin.
const adminOnly = [requireAuth, requireRole('SUPER_ADMIN', 'ADMIN')];
// Door staff (CHECKIN role) can scan, see that person's ID and mark them present, and nothing else.
const canCheckId = [requireAuth, requirePermission('delegate_id.scan')];

const idFormLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false });
const idImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
}).single('idImage');
const receiveIdImage = (req, res, next) => idImageUpload(req, res, (error) => {
  if (!error) return next();
  return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Please upload a photo smaller than 8 MB.' : 'That file could not be uploaded.' });
});

router.get('/', ...adminOnly, listDelegates);
router.post('/import', ...adminOnly, importDelegates);
router.patch('/:id/attendance', ...adminOnly, setAttendance);
router.post('/:id/send-confirmation', ...adminOnly, sendConfirmation);
router.post('/:id/send-whatsapp-invite', ...adminOnly, sendWhatsappInvite);
router.post('/check-in/preview', ...canCheckId, previewCheckIn);
router.post('/check-in', ...canCheckId, checkIn);

// Photo ID: the public form is reached by the private link in the delegate's email.
router.get('/id-form/:token', idFormLimiter, getIdForm);
router.post('/id-form/:token', idFormLimiter, receiveIdImage, submitIdForm);
router.get('/ids', ...adminOnly, listDelegateIds);
router.get('/ids/export', ...adminOnly, exportVenueList);
router.post('/:id/send-id-request', ...adminOnly, sendIdRequest);
router.patch('/:id/id-status', ...adminOnly, reviewId);
router.get('/:id/id-document', ...canCheckId, getIdDocument);

// Sponsor booths scan delegates for coupons; admins can use it too for testing.
router.post('/sponsor-scan', requireAuth, requirePermission('sponsor_scan'), sponsorScan);

module.exports = router;
