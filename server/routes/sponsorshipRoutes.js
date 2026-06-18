const fs = require('fs');
const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const {
  allocateStall,
  archiveSponsor,
  assignDeliverable,
  dashboard,
  deleteSponsor,
  deleteTier,
  getSponsor,
  listCommunications,
  listContracts,
  listDeliverables,
  listExhibitors,
  listInvoices,
  listSponsors,
  listStalls,
  listTiers,
  reports,
  saveCommunication,
  saveContract,
  saveDeliverable,
  saveInvoice,
  saveSponsor,
  saveStall,
  saveTier,
  updateSponsorDeliverable,
} = require('../controllers/sponsorshipController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const sponsorUploadDir = path.join(__dirname, '..', 'uploads', 'sponsors');
fs.mkdirSync(sponsorUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sponsorUploadDir),
  filename: (_req, file, cb) => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `sponsor-${suffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    cb(null, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ].includes(file.mimetype));
  },
  limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE || 10 * 1024 * 1024) },
});

router.use(requireAuth);

router.get('/sponsorship/dashboard', requirePermission('manage_sponsors', 'view_sponsorship_reports'), dashboard);
router.get('/sponsorship/reports', requirePermission('view_sponsorship_reports', 'manage_sponsors'), reports);

router.get('/sponsors', requirePermission('manage_sponsors'), listSponsors);
router.post('/sponsors', requirePermission('manage_sponsors'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), saveSponsor);
router.get('/sponsors/:id', requirePermission('manage_sponsors'), getSponsor);
router.put('/sponsors/:id', requirePermission('manage_sponsors'), upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), saveSponsor);
router.patch('/sponsors/:id/archive', requirePermission('manage_sponsors'), archiveSponsor);
router.delete('/sponsors/:id', requirePermission('manage_sponsors'), deleteSponsor);
router.post('/sponsors/:id/deliverables', requirePermission('manage_deliverables', 'manage_sponsors'), assignDeliverable);
router.patch('/sponsor-deliverables/:deliverableId', requirePermission('manage_deliverables', 'manage_sponsors'), updateSponsorDeliverable);
router.get('/sponsors/:id/communications', requirePermission('manage_sponsors'), listCommunications);
router.post('/sponsors/:id/communications', requirePermission('manage_sponsors'), saveCommunication);

router.get('/sponsor-tiers', requirePermission('manage_sponsor_tiers', 'manage_sponsors'), listTiers);
router.post('/sponsor-tiers', requirePermission('manage_sponsor_tiers'), saveTier);
router.put('/sponsor-tiers/:id', requirePermission('manage_sponsor_tiers'), saveTier);
router.delete('/sponsor-tiers/:id', requirePermission('manage_sponsor_tiers'), deleteTier);

router.get('/deliverables', requirePermission('manage_deliverables', 'manage_sponsors'), listDeliverables);
router.post('/deliverables', requirePermission('manage_deliverables'), saveDeliverable);
router.put('/deliverables/:id', requirePermission('manage_deliverables'), saveDeliverable);

router.get('/stalls', requirePermission('manage_stalls', 'manage_exhibitors'), listStalls);
router.post('/stalls', requirePermission('manage_stalls'), saveStall);
router.put('/stalls/:id', requirePermission('manage_stalls'), saveStall);
router.post('/stalls/:id/allocate', requirePermission('manage_stalls', 'manage_exhibitors'), allocateStall);
router.get('/exhibitors', requirePermission('manage_exhibitors', 'manage_stalls'), listExhibitors);

router.get('/contracts', requirePermission('manage_contracts', 'manage_sponsors'), listContracts);
router.post('/contracts', requirePermission('manage_contracts'), upload.single('file'), saveContract);
router.put('/contracts/:id', requirePermission('manage_contracts'), upload.single('file'), saveContract);

router.get('/invoices', requirePermission('manage_invoices', 'manage_sponsors'), listInvoices);
router.post('/invoices', requirePermission('manage_invoices'), upload.single('file'), saveInvoice);
router.put('/invoices/:id', requirePermission('manage_invoices'), upload.single('file'), saveInvoice);

module.exports = router;
