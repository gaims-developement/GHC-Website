const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  createPartner,
  deletePartner,
  listPartners,
  reorderPartners,
  updatePartner,
} = require('../controllers/partnerController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/authMiddleware');

const partnerUploadDir = path.join(__dirname, '..', 'uploads', 'partners');
fs.mkdirSync(partnerUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, partnerUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `partner-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024) },
});

const canManagePartners = requireRole('SUPER_ADMIN', 'ADMIN', 'MEDIA');

router.get('/', optionalAuth, listPartners);
router.post('/', requireAuth, canManagePartners, upload.single('logo'), createPartner);
router.put('/:id', requireAuth, canManagePartners, upload.single('logo'), updatePartner);
router.delete('/:id', requireAuth, canManagePartners, deletePartner);
router.patch('/reorder', requireAuth, canManagePartners, reorderPartners);

module.exports = router;
