const router = require('express').Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const speakerRoutes = require('./speakerRoutes');
const workshopRoutes = require('./workshopRoutes');
const eventRoutes = require('./eventRoutes');
const partnerRoutes = require('./partnerRoutes');
const sponsorshipRoutes = require('./sponsorshipRoutes');
const mediaRoutes = require('./mediaRoutes');
const marketingRoutes = require('./marketingRoutes');
const settingsRoutes = require('./settingsRoutes');
const trailerRoutes = require('./trailerRoutes');
const researchRoutes = require('./researchRoutes');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const operationsRoutes = require('./operationsRoutes');
const logisticsRoutes = require('./logisticsRoutes');
const volunteerRoutes = require('./volunteerRoutes');
const formRoutes = require('./formRoutes');
const mobileRoutes = require('./mobileRoutes');
const scheduleRoutes = require('./scheduleRoutes');
const coreRoutes = require('./coreRoutes');
const systemRoutes = require('./systemRoutes');
const systemAdminRoutes = require('./systemAdminRoutes');
const superAdminRoutes = require('./superAdminRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const committeeRoutes = require('./committeeRoutes');
const adminCommitteeRoutes = require('./adminCommitteeRoutes');
const visaRoutes = require('./visaRoutes');
const locationRoutes = require('./locationRoutes');
const hospitalityRoutes = require('./hospitalityRoutes');
const { optionalAuth, requireAuth, requirePermission } = require('../middleware/authMiddleware');
const { eventContext } = require('../middleware/eventContextMiddleware');

// TODO: Remove temporary SMTP diagnostic endpoint after Railway SMTP connectivity debugging is complete.
const debugRoutes = require('./debugRoutes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
// TODO: Remove temporary SMTP diagnostic endpoint after Railway SMTP connectivity debugging is complete.
router.use('/debug', debugRoutes);
router.use(optionalAuth, eventContext);

// Explicitly mounted routes (MUST be before root-mounted routers to avoid being swallowed)
router.use('/speakers', speakerRoutes);
router.use('/workshops', workshopRoutes);
router.use('/partners', partnerRoutes);
router.use('/media', mediaRoutes);
router.use('/settings', settingsRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/trailer', trailerRoutes);
router.use('/research', researchRoutes);
router.use('/committees', committeeRoutes);
router.use('/visa-applications', visaRoutes);
router.use('/locations', locationRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/', hospitalityRoutes);
router.use('/admin/committees', requireAuth, requirePermission('speakers.manage', 'cms.manage', 'manage_homepage'), adminCommitteeRoutes);

// Root-mounted routers (catch-all for their respective domains)
router.use('/', eventRoutes);
router.use('/', sponsorshipRoutes);
router.use('/', marketingRoutes);
router.use('/', paymentRoutes);
router.use('/', operationsRoutes);
router.use('/', logisticsRoutes);
router.use('/', volunteerRoutes);
router.use('/', formRoutes);
router.use('/', mobileRoutes);
router.use('/', coreRoutes);
router.use('/', systemRoutes);
router.use('/', registrationRoutes);
router.use('/', superAdminRoutes);
router.use('/', systemAdminRoutes);
module.exports = router;
