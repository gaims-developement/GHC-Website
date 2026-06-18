const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  awardResearch,
  assignPresentation,
  assignReviewer,
  createResearch,
  deleteResearch,
  getSettings,
  getResearch,
  assignedReviews,
  listAwards,
  listAwardResults,
  listCategories,
  listCriteria,
  listJudges,
  listPresentationAssignments,
  listPresentationSessions,
  listResearch,
  listReviewers,
  listReviews,
  removeReviewerAssignment,
  researchStats,
  reviewResearch,
  saveAward,
  saveAwardResult,
  saveCategory,
  saveCriteria,
  saveJudge,
  savePresentationSession,
  saveReviewer,
  saveSettings,
  scientificReports,
  submitScore,
  statusResearch,
  submitResearch,
  updateResearch,
} = require('../controllers/researchController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

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

const canManageResearch = requirePermission('manage_abstracts', 'research.manage');
const canReviewResearch = requirePermission('review_abstracts', 'manage_abstracts', 'research.manage');
const canManageReviewers = requirePermission('manage_reviewers');
const canAssignReviewers = requirePermission('assign_reviewers');
const canPublishProgram = requirePermission('publish_scientific_program');
const canManageAwards = requirePermission('manage_awards');
const canManageJudges = requirePermission('manage_judges');

router.get('/', optionalAuth, listResearch);
router.get('/stats', requireAuth, canManageResearch, researchStats);
router.get('/reports', requireAuth, canPublishProgram, scientificReports);
router.get('/settings', requireAuth, canManageResearch, getSettings);
router.put('/settings', requireAuth, canManageResearch, saveSettings);
router.get('/categories', requireAuth, canManageResearch, listCategories);
router.post('/categories', requireAuth, canManageResearch, saveCategory);
router.put('/categories/:id', requireAuth, canManageResearch, saveCategory);
router.get('/criteria', requireAuth, canManageResearch, listCriteria);
router.post('/criteria', requireAuth, canManageResearch, saveCriteria);
router.put('/criteria/:id', requireAuth, canManageResearch, saveCriteria);
router.get('/reviewers', requireAuth, canManageReviewers, listReviewers);
router.post('/reviewers', requireAuth, canManageReviewers, saveReviewer);
router.put('/reviewers/:id', requireAuth, canManageReviewers, saveReviewer);
router.get('/reviews', requireAuth, canReviewResearch, listReviews);
router.get('/reviews/assigned', requireAuth, canReviewResearch, assignedReviews);
router.get('/presentation-sessions', requireAuth, canPublishProgram, listPresentationSessions);
router.post('/presentation-sessions', requireAuth, canPublishProgram, savePresentationSession);
router.put('/presentation-sessions/:id', requireAuth, canPublishProgram, savePresentationSession);
router.get('/presentation-assignments', requireAuth, canPublishProgram, listPresentationAssignments);
router.post('/presentation-assignments', requireAuth, canPublishProgram, assignPresentation);
router.get('/judges', requireAuth, canManageJudges, listJudges);
router.post('/judges', requireAuth, canManageJudges, saveJudge);
router.put('/judges/:id', requireAuth, canManageJudges, saveJudge);
router.get('/awards', requireAuth, canManageAwards, listAwards);
router.post('/awards', requireAuth, canManageAwards, saveAward);
router.put('/awards/:id', requireAuth, canManageAwards, saveAward);
router.get('/award-results', requireAuth, canManageAwards, listAwardResults);
router.post('/award-results', requireAuth, canManageAwards, saveAwardResult);
router.post('/submit', upload.single('pdf'), submitResearch);
router.get('/:id', optionalAuth, getResearch);
router.post('/', requireAuth, canManageResearch, upload.single('pdf'), createResearch);
router.put('/:id', requireAuth, canManageResearch, upload.single('pdf'), updateResearch);
router.delete('/:id', requireAuth, canManageResearch, deleteResearch);
router.post('/:id/reviewers', requireAuth, canAssignReviewers, assignReviewer);
router.delete('/:id/reviewers/:reviewerId', requireAuth, canAssignReviewers, removeReviewerAssignment);
router.patch('/:id/review', requireAuth, canReviewResearch, reviewResearch);
router.post('/:id/reviews', requireAuth, canReviewResearch, submitScore);
router.patch('/:id/status', requireAuth, canManageResearch, statusResearch);
router.patch('/:id/award', requireAuth, canReviewResearch, awardResearch);

module.exports = router;
