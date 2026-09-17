const express = require('express');
const router = express.Router();
const visaController = require('../controllers/visaController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Public Endpoint
router.post(
  '/', 
  upload.fields([{ name: 'passport_document', maxCount: 1 }]),
  visaController.submitApplication
);

// Admin Endpoints
router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN', 'SYSTEM_ADMIN', 'ADMIN'));

router.get('/', visaController.getApplications);
router.get('/settings', visaController.getSettings);
router.post('/settings', visaController.updateSettings);

router.get('/:id', visaController.getApplicationDetails);
router.patch('/:id/status', visaController.updateStatus);
router.post('/:id/generate-letter', visaController.generateLetter);

module.exports = router;
