const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const { deleteMedia, listMedia, uploadMedia } = require('../controllers/mediaController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const mediaUploadDir = path.join(__dirname, '..', 'uploads', 'media');
fs.mkdirSync(mediaUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, mediaUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `media-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 25 * 1024 * 1024) },
});

const canManageMedia = requirePermission('media.manage', 'manage_gallery');

router.get('/', requireAuth, canManageMedia, listMedia);
router.post('/', requireAuth, canManageMedia, upload.single('file'), uploadMedia);
router.delete('/:id', requireAuth, canManageMedia, deleteMedia);

module.exports = router;
