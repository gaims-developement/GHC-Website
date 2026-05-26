const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  awardResearch,
  createResearch,
  deleteResearch,
  getResearch,
  listResearch,
  researchStats,
  reviewResearch,
  statusResearch,
  submitResearch,
  updateResearch,
} = require('../controllers/researchController');
const { optionalAuth, requireAuth, requireRole } = require('../middleware/authMiddleware');

const researchUploadDir = path.join(__dirname, '..', 'uploads', 'research');
fs.mkdirSync(researchUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, researchUploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `research-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
  limits: { fileSize: Number(process.env.MAX_RESEARCH_UPLOAD_SIZE || 10 * 1024 * 1024) },
});

const canManageResearch = requireRole('SUPER_ADMIN', 'ADMIN', 'RESEARCH');
const canReviewResearch = requireRole('SUPER_ADMIN', 'ADMIN', 'RESEARCH');

router.get('/', optionalAuth, listResearch);
router.get('/stats', requireAuth, canManageResearch, researchStats);
router.post('/submit', upload.single('pdf'), submitResearch);
router.get('/:id', optionalAuth, getResearch);
router.post('/', requireAuth, canManageResearch, upload.single('pdf'), createResearch);
router.put('/:id', requireAuth, canManageResearch, upload.single('pdf'), updateResearch);
router.delete('/:id', requireAuth, canManageResearch, deleteResearch);
router.patch('/:id/review', requireAuth, canReviewResearch, reviewResearch);
router.patch('/:id/status', requireAuth, canManageResearch, statusResearch);
router.patch('/:id/award', requireAuth, canReviewResearch, awardResearch);

module.exports = router;
