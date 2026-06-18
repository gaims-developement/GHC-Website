const router = require('express').Router();
const {
  activity,
  adminAnalytics,
  adminDashboard,
  adminNotifications,
  adminUsers,
  announcements,
  appSettings,
  bookmarkSpeaker,
  bootstrap,
  certificates,
  login,
  mobileCheckin,
  notifications,
  profile,
  registerWorkshop,
  resources,
  saveDeviceToken,
  saveSession,
  schedule,
  speakers,
  sponsors,
  unsaveSession,
  venue,
  workshops,
} = require('../controllers/mobileController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

router.post('/mobile/auth/login', login);
router.get('/mobile/bootstrap', bootstrap);
router.get('/mobile/me', profile);
router.put('/mobile/me', profile);
router.get('/mobile/schedule', schedule);
router.get('/mobile/speakers', speakers);
router.get('/mobile/workshops', workshops);
router.get('/mobile/announcements', announcements);
router.get('/mobile/sponsors', sponsors);
router.get('/mobile/resources', resources);
router.get('/mobile/certificates', certificates);
router.get('/mobile/venue', venue);
router.get('/mobile/notifications', notifications);
router.post('/mobile/device-token', saveDeviceToken);
router.post('/mobile/sessions/:id/save', saveSession);
router.delete('/mobile/sessions/:id/save', unsaveSession);
router.post('/mobile/speakers/:id/bookmark', bookmarkSpeaker);
router.post('/mobile/workshops/:id/register', registerWorkshop);
router.post('/mobile/check-in', mobileCheckin);
router.post('/mobile/activity', activity);

router.get('/mobile-admin/dashboard', requireAuth, requirePermission('manage_mobile_app'), adminDashboard);
router.get('/mobile-admin/users', requireAuth, requirePermission('manage_mobile_users'), adminUsers);
router.get('/mobile-admin/notifications', requireAuth, requirePermission('manage_notifications'), adminNotifications);
router.post('/mobile-admin/notifications', requireAuth, requirePermission('manage_notifications'), adminNotifications);
router.get('/mobile-admin/analytics', requireAuth, requirePermission('view_mobile_analytics'), adminAnalytics);
router.get('/mobile-admin/settings', requireAuth, requirePermission('manage_mobile_app'), appSettings);
router.put('/mobile-admin/settings', requireAuth, requirePermission('manage_mobile_app'), appSettings);

module.exports = router;
