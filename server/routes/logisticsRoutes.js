const router = require('express').Router();
const { dashboard, list, publicSync, reports, save } = require('../controllers/logisticsController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

router.get('/public/logistics-sync', optionalAuth, publicSync);

router.use(requireAuth);
router.get('/logistics/dashboard', requirePermission('manage_venues', 'manage_halls'), dashboard);
router.get('/logistics/reports', requirePermission('manage_venues', 'manage_inventory'), reports);

const routes = [
  ['accommodations', 'accommodations', 'manage_accommodation'],
  ['accommodation-bookings', 'accommodationBookings', 'manage_accommodation'],
  ['transport-routes', 'transportRoutes', 'manage_transport'],
  ['transport-bookings', 'transportBookings', 'manage_transport'],
  ['vendor-categories', 'vendorCategories', 'manage_vendors'],
  ['vendors', 'vendors', 'manage_vendors'],
  ['inventory', 'inventory', 'manage_inventory'],
  ['inventory-allocations', 'inventoryAllocations', 'manage_inventory'],
  ['volunteers', 'volunteers', 'manage_volunteers'],
  ['security', 'security', 'manage_security'],
  ['emergency', 'emergency', 'manage_emergency_contacts'],
  ['logistics-tasks', 'tasks', 'manage_venues'],
];

routes.forEach(([path, type, permission]) => {
  router.get(`/${path}`, requirePermission(permission), list(type));
  router.post(`/${path}`, requirePermission(permission), save(type));
  router.put(`/${path}/:id`, requirePermission(permission), save(type));
});

module.exports = router;
