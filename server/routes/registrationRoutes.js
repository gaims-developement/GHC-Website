const router = require('express').Router();
const {
  checkInRegistration,
  createRegistration,
  createTicket,
  exportRegistrationsCsv,
  exportRegistrationsExcel,
  getRegistration,
  listRegistrations,
  listTickets,
  updateRegistrationStatus,
} = require('../controllers/registrationController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const canManageRegistrations = requireRole('SUPER_ADMIN', 'ADMIN', 'VOLUNTEER');
const canManageTickets = requireRole('SUPER_ADMIN', 'ADMIN');

router.post('/register', createRegistration);
router.get('/register', requireAuth, canManageRegistrations, listRegistrations);
router.get('/register/export.csv', requireAuth, canManageRegistrations, exportRegistrationsCsv);
router.get('/register/export.xls', requireAuth, canManageRegistrations, exportRegistrationsExcel);
router.get('/register/:id', requireAuth, canManageRegistrations, getRegistration);
router.patch('/register/:id/status', requireAuth, canManageRegistrations, updateRegistrationStatus);
router.patch('/register/:id/checkin', requireAuth, canManageRegistrations, checkInRegistration);
router.get('/tickets', listTickets);
router.post('/tickets', requireAuth, canManageTickets, createTicket);

module.exports = router;
