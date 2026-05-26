const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  closeWorkshop,
  confirmWorkshopRegistration,
  createWorkshop,
  deleteWorkshop,
  getWorkshop,
  listWorkshops,
  publishWorkshop,
  reorderWorkshops,
  updateWorkshop,
  workshopStats,
} = require('../controllers/workshopController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/authMiddleware');

const workshopUploadDir = path.join(__dirname, '..', 'uploads', 'workshops');
fs.mkdirSync(workshopUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, workshopUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `workshop-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024) },
});

const canManageWorkshops = requireRole('SUPER_ADMIN', 'ADMIN', 'MEDIA', 'RESEARCH');

router.get('/', optionalAuth, listWorkshops);
router.get('/stats', requireAuth, canManageWorkshops, workshopStats);
router.get('/:slug', optionalAuth, getWorkshop);
router.post('/', requireAuth, canManageWorkshops, upload.single('image'), createWorkshop);
router.post('/:id/register-confirmed', optionalAuth, confirmWorkshopRegistration);
router.put('/:id', requireAuth, canManageWorkshops, upload.single('image'), updateWorkshop);
router.delete('/:id', requireAuth, canManageWorkshops, deleteWorkshop);
router.patch('/reorder', requireAuth, canManageWorkshops, reorderWorkshops);
router.patch('/:id/publish', requireAuth, canManageWorkshops, publishWorkshop);
router.patch('/:id/close', requireAuth, canManageWorkshops, closeWorkshop);

module.exports = router;
