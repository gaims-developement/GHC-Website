const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const { getTrailer, removeTrailer, updateTrailer, uploadTrailer } = require('../controllers/trailerController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

const trailerUploadDir = path.join(__dirname, '..', 'uploads', 'trailer');
fs.mkdirSync(trailerUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, trailerUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `trailer-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (!allowedVideoTypes.includes(file.mimetype)) {
      return cb(new Error('Trailer must be an MP4, WebM, MOV, or M4V video file'));
    }
    return cb(null, true);
  },
  limits: { fileSize: Number(process.env.TRAILER_MAX_UPLOAD_SIZE || 200 * 1024 * 1024) },
});

const canManageTrailer = requireRole('SUPER_ADMIN', 'ADMIN', 'MEDIA');

const handleUploadError = (handler) => (req, res, next) => {
  handler(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Trailer video is too large. Maximum size is 200MB by default.' });
    }

    return res.status(400).json({ message: error.message || 'Unable to upload trailer video' });
  });
};

router.get('/', getTrailer);
router.put('/', requireAuth, canManageTrailer, updateTrailer);
router.delete('/', requireAuth, canManageTrailer, removeTrailer);
router.post('/upload', requireAuth, canManageTrailer, handleUploadError(upload.single('video')), uploadTrailer);

module.exports = router;
