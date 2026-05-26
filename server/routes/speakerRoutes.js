const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  createSpeaker,
  deleteSpeaker,
  getSpeaker,
  listSpeakers,
  publishSpeaker,
  reorderSpeakers,
  speakerStats,
  updateSpeaker,
} = require('../controllers/speakerController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/authMiddleware');

const speakerUploadDir = path.join(__dirname, '..', 'uploads', 'speakers');
fs.mkdirSync(speakerUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, speakerUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `speaker-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024) },
});

const canManageSpeakers = requireRole('SUPER_ADMIN', 'ADMIN', 'MEDIA');

router.get('/', optionalAuth, listSpeakers);
router.get('/stats', requireAuth, canManageSpeakers, speakerStats);
router.get('/:id', optionalAuth, getSpeaker);
router.post('/', requireAuth, canManageSpeakers, upload.single('photo'), createSpeaker);
router.put('/:id', requireAuth, canManageSpeakers, upload.single('photo'), updateSpeaker);
router.delete('/:id', requireAuth, canManageSpeakers, deleteSpeaker);
router.patch('/:id/publish', requireAuth, canManageSpeakers, publishSpeaker);
router.patch('/reorder', requireAuth, canManageSpeakers, reorderSpeakers);

module.exports = router;
