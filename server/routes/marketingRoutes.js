const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  analytics,
  approvalHistory,
  dashboard,
  deleteContent,
  listContent,
  publicSync,
  saveContent,
} = require('../controllers/marketingController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'marketing');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `marketing-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 25 * 1024 * 1024) },
});

router.get('/public/marketing-sync', optionalAuth, publicSync);

router.use(requireAuth);
router.get('/marketing/dashboard', requirePermission('manage_announcements', 'manage_news', 'manage_homepage', 'manage_gallery', 'manage_campaigns'), dashboard);
router.get('/marketing/analytics', requirePermission('manage_announcements', 'manage_news', 'manage_campaigns', 'manage_gallery'), analytics);
router.get('/marketing/:type', listContent);
router.post('/marketing/:type', upload.single('asset'), saveContent);
router.get('/marketing/:type/:id/history', approvalHistory);
router.put('/marketing/:type/:id', upload.single('asset'), saveContent);
router.delete('/marketing/:type/:id', deleteContent);

module.exports = router;
