const express = require('express');
const router = express.Router();
const { venue, cafe, stay, guideItem } = require('../controllers/hospitalityController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const checkAdmin = requirePermission('cms.manage');
const canManageHospitality = requirePermission('cms.manage', 'hospitality.manage');

// Public routes for fetching data
router.get('/venues', venue.getAll);
router.get('/cafes', cafe.getAll);
router.get('/stays', stay.getAll);
router.get('/venue-guide', guideItem.getAll);

// Protected routes for CMS
router.post('/venues', requireAuth, checkAdmin, venue.create);
router.put('/venues/:id', requireAuth, checkAdmin, venue.update);
router.delete('/venues/:id', requireAuth, checkAdmin, venue.delete);

router.post('/cafes', requireAuth, canManageHospitality, cafe.create);
router.put('/cafes/:id', requireAuth, canManageHospitality, cafe.update);
router.delete('/cafes/:id', requireAuth, canManageHospitality, cafe.delete);

router.post('/stays', requireAuth, canManageHospitality, stay.create);
router.put('/stays/:id', requireAuth, canManageHospitality, stay.update);
router.delete('/stays/:id', requireAuth, canManageHospitality, stay.delete);

router.post('/venue-guide', requireAuth, canManageHospitality, guideItem.create);
router.put('/venue-guide/:id', requireAuth, canManageHospitality, guideItem.update);
router.delete('/venue-guide/:id', requireAuth, canManageHospitality, guideItem.delete);

module.exports = router;
