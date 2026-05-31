const router = require('express').Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const speakerRoutes = require('./speakerRoutes');
const workshopRoutes = require('./workshopRoutes');
const partnerRoutes = require('./partnerRoutes');
const mediaRoutes = require('./mediaRoutes');
const settingsRoutes = require('./settingsRoutes');
const researchRoutes = require('./researchRoutes');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const operationsRoutes = require('./operationsRoutes');
const systemRoutes = require('./systemRoutes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/speakers', speakerRoutes);
router.use('/workshops', workshopRoutes);
router.use('/partners', partnerRoutes);
router.use('/media', mediaRoutes);
router.use('/settings', settingsRoutes);
router.use('/research', researchRoutes);
router.use('/', paymentRoutes);
router.use('/', operationsRoutes);
router.use('/', systemRoutes);
router.use('/', registrationRoutes);

module.exports = router;
