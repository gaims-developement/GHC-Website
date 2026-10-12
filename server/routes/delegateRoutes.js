const router = require('express').Router();
const { checkIn, importDelegates, listDelegates, sendConfirmation, setAttendance } = require('../controllers/delegateController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Delegates and attendance are restricted to Super Admin and Admin.
const adminOnly = [requireAuth, requireRole('SUPER_ADMIN', 'ADMIN')];

router.get('/', ...adminOnly, listDelegates);
router.post('/import', ...adminOnly, importDelegates);
router.patch('/:id/attendance', ...adminOnly, setAttendance);
router.post('/:id/send-confirmation', ...adminOnly, sendConfirmation);
router.post('/check-in', ...adminOnly, checkIn);

module.exports = router;
