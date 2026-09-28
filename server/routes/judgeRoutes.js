const express = require('express');
const router = express.Router();
const judgeController = require('../controllers/judgeController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes for candidates submitting nominations via the GHC website
router.get('/public/config', judgeController.getNominationConfig);

router.post(
  '/public/draft',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'photoFile', maxCount: 1 },
  ]),
  judgeController.saveNominationDraft
);

router.get('/public/draft/:draftId', judgeController.getNominationDraft);

router.post(
  '/public/submit',
  upload.fields([
    { name: 'cv', maxCount: 1 },
    { name: 'cvFile', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'photoFile', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  judgeController.publicSubmitNomination
);

// Authenticated Judge / Admin Endpoints
const canViewNomination = requirePermission('award_nomination_view');
const canAcceptNomination = requirePermission('award_nomination_accept');
const canRejectNomination = requirePermission('award_nomination_reject');
const canViewDocument = requirePermission('award_nomination_document_view', 'award_nomination_view');
const canManageNominationConfig = requirePermission('settings.manage', 'manage_awards');

router.use(requireAuth);

router.get('/dashboard-stats', canViewNomination, judgeController.getDashboardStats);
router.get('/nominations', canViewNomination, judgeController.getNominations);
router.get('/categories', canViewNomination, judgeController.getAwardCategories);
router.get('/nominations/:id', canViewNomination, judgeController.getNomination);
router.post('/nominations/:id/accept', canAcceptNomination, judgeController.acceptNomination);
router.post('/nominations/:id/reject', canRejectNomination, judgeController.rejectNomination);
router.get('/nominations/:id/documents/:docType', canViewDocument, judgeController.getDocument);
router.put('/config', canManageNominationConfig, judgeController.updateNominationConfig);

module.exports = router;
