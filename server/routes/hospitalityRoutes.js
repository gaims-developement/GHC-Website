const express = require('express');
const router = express.Router();
const { venue, cafe, stay } = require('../controllers/hospitalityController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const checkAdmin = requirePermission('cms.manage');

// Public routes for fetching data
router.get('/venues', venue.getAll);
router.get('/cafes', cafe.getAll);
router.get('/stays', stay.getAll);

// Protected routes for CMS
router.post('/venues', requireAuth, checkAdmin, venue.create);
router.put('/venues/:id', requireAuth, checkAdmin, venue.update);
router.delete('/venues/:id', requireAuth, checkAdmin, venue.delete);

router.post('/cafes', requireAuth, checkAdmin, cafe.create);
router.put('/cafes/:id', requireAuth, checkAdmin, cafe.update);
router.delete('/cafes/:id', requireAuth, checkAdmin, cafe.delete);

router.post('/stays', requireAuth, checkAdmin, stay.create);
router.put('/stays/:id', requireAuth, checkAdmin, stay.update);
router.delete('/stays/:id', requireAuth, checkAdmin, stay.delete);

module.exports = router;
