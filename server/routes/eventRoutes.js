const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  addRegistration,
  checkIn,
  dashboard,
  deleteEvent,
  duplicateEvent,
  generateCertificate,
  getEvent,
  listEventTypes,
  listEvents,
  listRecords,
  listVenues,
  publicSync,
  reports,
  saveEvent,
  saveEventType,
  saveFeedback,
  savePayment,
  saveResource,
  saveVenue,
  setEventStatus,
} = require('../controllers/eventController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

const uploadDir = path.join(__dirname, '..', 'uploads', 'events');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => cb(null, [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ].includes(file.mimetype)),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 25 * 1024 * 1024) },
});

const canManageEvents = requirePermission('manage_events', 'manage_workshops');
const canManageVenues = requirePermission('manage_venues', 'manage_events');

router.get('/public/events-sync', optionalAuth, publicSync);
router.get('/events', optionalAuth, listEvents);
router.get('/events/:id', optionalAuth, getEvent);

router.use(requireAuth);
router.get('/event-dashboard', canManageEvents, dashboard);
router.get('/event-types', canManageEvents, listEventTypes);
router.post('/event-types', canManageEvents, saveEventType);
router.put('/event-types/:id', canManageEvents, saveEventType);
router.get('/venues', canManageVenues, listVenues);
router.post('/venues', canManageVenues, saveVenue);
router.put('/venues/:id', canManageVenues, saveVenue);

router.post('/events', canManageEvents, upload.single('banner'), saveEvent);
router.put('/events/:id', canManageEvents, upload.single('banner'), saveEvent);
router.delete('/events/:id', canManageEvents, deleteEvent);
router.patch('/events/:id/publish', requirePermission('publish_events', 'manage_events'), setEventStatus('published'));
router.patch('/events/:id/cancel', canManageEvents, setEventStatus('cancelled'));
router.patch('/events/:id/complete', canManageEvents, setEventStatus('completed'));
router.patch('/events/:id/archive', canManageEvents, setEventStatus('archived'));
router.post('/events/:id/duplicate', canManageEvents, duplicateEvent);
router.post('/events/:id/registrations', requirePermission('manage_event_registrations', 'manage_events'), addRegistration);
router.patch('/event-registrations/:registrationId/check-in', requirePermission('manage_event_registrations', 'manage_events', 'checkin.scan'), checkIn);

router.get('/event-registrations', requirePermission('manage_event_registrations', 'manage_events'), listRecords('event_registrations', 'created_at DESC'));
router.get('/event-payments', requirePermission('manage_event_payments', 'manage_events'), listRecords('event_payments', 'created_at DESC'));
router.post('/event-payments', requirePermission('manage_event_payments'), savePayment);
router.get('/event-resources', requirePermission('manage_resources', 'manage_events'), listRecords('event_resources', 'created_at DESC'));
router.post('/event-resources', requirePermission('manage_resources'), upload.single('file'), saveResource);
router.get('/event-feedback', requirePermission('manage_feedback', 'manage_events'), listRecords('event_feedback', 'submitted_at DESC'));
router.post('/event-feedback', requirePermission('manage_feedback'), saveFeedback);
router.get('/event-certificates', requirePermission('manage_certificates', 'manage_events'), listRecords('event_certificates', 'generated_at DESC'));
router.post('/event-certificates', requirePermission('manage_certificates'), generateCertificate);
router.get('/event-submissions', requirePermission('manage_competitions', 'manage_events'), listRecords('event_submissions', 'created_at DESC'));
router.get('/event-reports', canManageEvents, reports);

module.exports = router;
