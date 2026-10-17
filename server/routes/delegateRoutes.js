const router = require('express').Router();
const { checkIn, importDelegates, listDelegates, sendConfirmation, sendWhatsappInvite, setAttendance, sponsorScan } = require('../controllers/delegateController');
const { requireAuth, requirePermission, requireRole } = require('../middleware/authMiddleware');

// Delegates and attendance are restricted to Super Admin and Admin.
const adminOnly = [requireAuth, requireRole('SUPER_ADMIN', 'ADMIN')];

router.get('/', ...adminOnly, listDelegates);
router.post('/import', ...adminOnly, importDelegates);
router.patch('/:id/attendance', ...adminOnly, setAttendance);
router.post('/:id/send-confirmation', ...adminOnly, sendConfirmation);
router.post('/:id/send-whatsapp-invite', ...adminOnly, sendWhatsappInvite);
router.post('/check-in', ...adminOnly, checkIn);

// Sponsor booths scan delegates for coupons; admins can use it too for testing.
router.post('/sponsor-scan', requireAuth, requirePermission('sponsor_scan'), sponsorScan);

module.exports = router;
