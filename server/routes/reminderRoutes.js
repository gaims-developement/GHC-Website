const router = require('express').Router();
const { deleteReminder, importReminders, listReminders, sendReminder } = require('../controllers/reminderController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Reminders hold personal contact lists, so like Delegates and Invites they are restricted to Super Admin and Admin.
const adminOnly = [requireAuth, requireRole('SUPER_ADMIN', 'ADMIN')];

router.get('/', ...adminOnly, listReminders);
router.post('/import', ...adminOnly, importReminders);
router.post('/:id/send', ...adminOnly, sendReminder);
router.delete('/:id', ...adminOnly, deleteReminder);

module.exports = router;
