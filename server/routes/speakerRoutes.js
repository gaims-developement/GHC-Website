const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  createSpeaker,
  archiveSpeaker,
  deleteSpeaker,
  deleteHall,
  deleteSession,
  deleteTrack,
  getSpeaker,
  listCme,
  listHalls,
  listResources,
  listSessions,
  listSpeakers,
  listTracks,
  publishSpeaker,
  reorderSpeakers,
  saveCme,
  saveHall,
  saveResource,
  saveSession,
  saveTrack,
  speakerAnalytics,
  speakerStats,
  updateSpeaker,
} = require('../controllers/speakerController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

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
    cb(null, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'video/mp4'].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 5 * 1024 * 1024) },
});

const canManageSpeakers = requirePermission('manage_speakers', 'speakers.manage');
const canEditSpeakers = requirePermission('edit_speakers', 'manage_speakers', 'speakers.manage');
const canDeleteSpeakers = requirePermission('delete_speakers', 'manage_speakers', 'speakers.manage');
const canManageSessions = requirePermission('manage_sessions');
const canManageTracks = requirePermission('manage_tracks');
const canManageHalls = requirePermission('manage_halls');
const canManageCme = requirePermission('manage_cme');
const canUploadResources = requirePermission('upload_resources');

router.get('/', optionalAuth, listSpeakers);
router.get('/stats', requireAuth, canManageSpeakers, speakerStats);
router.get('/analytics', requireAuth, canManageSpeakers, speakerAnalytics);
router.get('/sessions', requireAuth, canManageSessions, listSessions);
router.post('/sessions', requireAuth, canManageSessions, saveSession);
router.put('/sessions/:id', requireAuth, canManageSessions, saveSession);
router.delete('/sessions/:id', requireAuth, canManageSessions, deleteSession);
router.get('/tracks', requireAuth, canManageTracks, listTracks);
router.post('/tracks', requireAuth, canManageTracks, saveTrack);
router.put('/tracks/:id', requireAuth, canManageTracks, saveTrack);
router.delete('/tracks/:id', requireAuth, canManageTracks, deleteTrack);
router.get('/halls', requireAuth, canManageHalls, listHalls);
router.post('/halls', requireAuth, canManageHalls, saveHall);
router.put('/halls/:id', requireAuth, canManageHalls, saveHall);
router.delete('/halls/:id', requireAuth, canManageHalls, deleteHall);
router.get('/resources', requireAuth, canUploadResources, listResources);
router.post('/resources', requireAuth, canUploadResources, upload.single('file'), saveResource);
router.get('/cme', requireAuth, canManageCme, listCme);
router.post('/cme', requireAuth, canManageCme, saveCme);
router.get('/:id', optionalAuth, getSpeaker);
router.post('/', requireAuth, canManageSpeakers, upload.single('photo'), createSpeaker);
router.put('/:id', requireAuth, canEditSpeakers, upload.single('photo'), updateSpeaker);
router.delete('/:id', requireAuth, canDeleteSpeakers, deleteSpeaker);
router.patch('/:id/archive', requireAuth, canEditSpeakers, archiveSpeaker);
router.patch('/:id/publish', requireAuth, canEditSpeakers, publishSpeaker);
router.patch('/reorder', requireAuth, canManageSpeakers, reorderSpeakers);

module.exports = router;
