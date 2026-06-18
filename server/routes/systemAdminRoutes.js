const router = require('express').Router();
const controller = require('../controllers/systemAdminController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

router.use(requireAuth);

router.get('/system-admin/dashboard', requirePermission('manage_system'), controller.dashboard);
router.get('/system-admin/audit-logs', requirePermission('view_audit_logs'), controller.auditLogs);
router.get('/system-admin/login-logs', requirePermission('view_audit_logs', 'manage_security'), controller.loginLogs);
router.get('/system-admin/sessions', requirePermission('manage_system'), controller.sessions);
router.delete('/system-admin/sessions/:id', requirePermission('manage_system'), controller.terminateSession);

router.get('/system-admin/api-monitoring', requirePermission('view_system_reports'), controller.apiMonitoring);
router.get('/system-admin/database', requirePermission('view_system_reports'), controller.databaseMonitoring);
router.get('/system-admin/cloudinary', requirePermission('view_system_reports'), controller.cloudinaryMonitoring);
router.get('/system-admin/email', requirePermission('view_system_reports'), controller.emailMonitoring);

router.get('/system-admin/notifications', requirePermission('manage_system'), controller.notifications);
router.post('/system-admin/notifications', requirePermission('manage_system'), controller.notifications);
router.get('/system-admin/backups', requirePermission('manage_backups'), controller.backups);
router.post('/system-admin/backups', requirePermission('manage_backups'), controller.backups);
router.get('/system-admin/security', requirePermission('manage_security'), controller.security);
router.get('/system-admin/feature-flags', requirePermission('manage_system'), controller.featureFlags);
router.post('/system-admin/feature-flags', requirePermission('manage_system'), controller.featureFlags);
router.get('/system-admin/maintenance', requirePermission('manage_settings'), controller.maintenance);
router.put('/system-admin/maintenance', requirePermission('manage_settings'), controller.maintenance);
router.get('/system-admin/settings', requirePermission('manage_settings'), controller.settings);

router.get('/system-admin/users', requirePermission('manage_users'), controller.users);
router.put('/system-admin/users/:id', requirePermission('manage_users'), controller.users);
router.get('/system-admin/roles', requirePermission('manage_roles'), controller.roles);
router.post('/system-admin/roles', requirePermission('manage_roles'), controller.roles);
router.put('/system-admin/roles/:id/permissions', requirePermission('manage_permissions'), controller.updateRolePermissions);

module.exports = router;
