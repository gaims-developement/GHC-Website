const router = require('express').Router();
const { deleteInvite, importInvites, listInvites, sendInvite } = require('../controllers/inviteController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// Invites hold personal contact lists, so like Delegates they are restricted to Super Admin and Admin.
const adminOnly = [requireAuth, requireRole('SUPER_ADMIN', 'ADMIN')];

router.get('/', ...adminOnly, listInvites);
router.post('/import', ...adminOnly, importInvites);
router.post('/:id/send', ...adminOnly, sendInvite);
router.delete('/:id', ...adminOnly, deleteInvite);

module.exports = router;
