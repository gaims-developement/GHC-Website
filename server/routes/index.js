const router = require('express').Router();
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const speakerRoutes = require('./speakerRoutes');
const workshopRoutes = require('./workshopRoutes');
const researchRoutes = require('./researchRoutes');
const registrationRoutes = require('./registrationRoutes');
const paymentRoutes = require('./paymentRoutes');
const operationsRoutes = require('./operationsRoutes');
const systemRoutes = require('./systemRoutes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/speakers', speakerRoutes);
router.use('/workshops', workshopRoutes);
router.use('/research', researchRoutes);
router.use('/', paymentRoutes);
router.use('/', operationsRoutes);
router.use('/', systemRoutes);
router.use('/', registrationRoutes);

module.exports = router;
