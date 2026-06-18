const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const {
  addNote,
  analytics,
  dashboard,
  exportSubmissionsCsv,
  getForm,
  getSubmission,
  listForms,
  listSubmissions,
  metadata,
  publicForm,
  removeForm,
  saveForm,
  submissionPdf,
  submitForm,
  updateSubmission,
} = require('../controllers/formController');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`),
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.FORM_UPLOAD_LIMIT_MB || 20) * 1024 * 1024 },
});

const canManageForms = requirePermission('manage_forms');
const canCreateForms = requirePermission('create_forms', 'manage_forms');
const canEditForms = requirePermission('edit_forms', 'manage_forms');
const canPublishForms = requirePermission('publish_forms', 'manage_forms');
const canReviewSubmissions = requirePermission('review_submissions', 'manage_forms');
const canExportSubmissions = requirePermission('export_submissions', 'manage_forms');

router.get('/forms/public/:slug', optionalAuth, publicForm);
router.post('/forms/public/:slug/submit', optionalAuth, upload.any(), submitForm);

router.get('/forms/dashboard', requireAuth, canManageForms, dashboard);
router.get('/forms/metadata', requireAuth, canManageForms, metadata);
router.get('/forms/analytics', requireAuth, canManageForms, analytics);
router.get('/forms', requireAuth, canManageForms, listForms);
router.post('/forms', requireAuth, canCreateForms, saveForm);
router.get('/forms/:id', requireAuth, canManageForms, getForm);
router.put('/forms/:id', requireAuth, canEditForms, saveForm);
router.put('/forms/:id/publish', requireAuth, canPublishForms, saveForm);
router.delete('/forms/:id', requireAuth, canEditForms, removeForm);

router.get('/forms/:id/submissions', requireAuth, canReviewSubmissions, listSubmissions);
router.get('/forms/:id/submissions/export.csv', requireAuth, canExportSubmissions, exportSubmissionsCsv);
router.get('/forms/:id/submissions/:submissionId', requireAuth, canReviewSubmissions, getSubmission);
router.put('/forms/:id/submissions/:submissionId', requireAuth, canReviewSubmissions, updateSubmission);
router.post('/forms/:id/submissions/:submissionId/notes', requireAuth, canReviewSubmissions, addNote);
router.get('/forms/:id/submissions/:submissionId.pdf', requireAuth, canExportSubmissions, submissionPdf);

module.exports = router;
