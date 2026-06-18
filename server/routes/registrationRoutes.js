const router = require('express').Router();
const {
  checkInRegistration,
  cancelRegistration,
  createRegistration,
  createTicket,
  deactivateCoupon,
  deleteCategory,
  deleteRegistration,
  deleteTicket,
  exportRegistrationsCsv,
  exportRegistrationsExcel,
  getRegistration,
  listBadges,
  listAdminTickets,
  listCategories,
  listCoupons,
  listRegistrations,
  listTickets,
  markBadgeGenerated,
  refundRegistration,
  registrationDashboard,
  registrationReports,
  saveCategory,
  saveCoupon,
  updateRegistration,
  updateTicket,
  updateRegistrationStatus,
} = require('../controllers/registrationController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const canManageRegistrations = requirePermission('manage_registrations');
const canViewRegistrations = requirePermission('view_registrations', 'manage_registrations');
const canEditRegistrations = requirePermission('edit_registrations', 'manage_registrations');
const canManagePayments = requirePermission('manage_payments');
const canManageCheckins = requirePermission('manage_checkins', 'checkin.scan');
const canManageBadges = requirePermission('manage_badges');
const canManageCoupons = requirePermission('manage_coupons');
const canExportRegistrations = requirePermission('export_registration_data');
const canManageTickets = requirePermission('manage_registrations');

router.post('/register', createRegistration);
router.get('/register/dashboard', requireAuth, canViewRegistrations, registrationDashboard);
router.get('/register', requireAuth, canViewRegistrations, listRegistrations);
router.get('/register/export.csv', requireAuth, canExportRegistrations, exportRegistrationsCsv);
router.get('/register/export.xls', requireAuth, canExportRegistrations, exportRegistrationsExcel);
router.get('/register/categories', requireAuth, canViewRegistrations, listCategories);
router.post('/register/categories', requireAuth, canManageRegistrations, saveCategory);
router.put('/register/categories/:id', requireAuth, canManageRegistrations, saveCategory);
router.delete('/register/categories/:id', requireAuth, canManageRegistrations, deleteCategory);
router.get('/register/coupons', requireAuth, canManageCoupons, listCoupons);
router.post('/register/coupons', requireAuth, canManageCoupons, saveCoupon);
router.put('/register/coupons/:id', requireAuth, canManageCoupons, saveCoupon);
router.patch('/register/coupons/:id/deactivate', requireAuth, canManageCoupons, deactivateCoupon);
router.get('/register/badges', requireAuth, canManageBadges, listBadges);
router.patch('/register/:id/badge', requireAuth, canManageBadges, markBadgeGenerated);
router.get('/register/reports', requireAuth, canExportRegistrations, registrationReports);
router.get('/register/:id', requireAuth, canViewRegistrations, getRegistration);
router.put('/register/:id', requireAuth, canEditRegistrations, updateRegistration);
router.patch('/register/:id/status', requireAuth, canEditRegistrations, updateRegistrationStatus);
router.patch('/register/:id/cancel', requireAuth, canEditRegistrations, cancelRegistration);
router.patch('/register/:id/refund', requireAuth, canManagePayments, refundRegistration);
router.patch('/register/:id/checkin', requireAuth, canManageCheckins, checkInRegistration);
router.delete('/register/:id', requireAuth, canManageRegistrations, deleteRegistration);
router.get('/tickets/admin', requireAuth, canManageTickets, listAdminTickets);
router.get('/tickets', listTickets);
router.post('/tickets', requireAuth, canManageTickets, createTicket);
router.put('/tickets/:id', requireAuth, canManageTickets, updateTicket);
router.delete('/tickets/:id', requireAuth, canManageTickets, deleteTicket);

module.exports = router;
