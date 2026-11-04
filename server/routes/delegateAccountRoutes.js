const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { claimWorkshop, downloadCertificate, getMe, listCertificates, listWorkshops, requestOtp, verifyOtp } = require('../controllers/delegateAccountController');
const { requireDelegate } = require('../middleware/authMiddleware');

const limiter = (limit) => rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Please wait a few minutes and try again.' } });

router.post('/request-otp', limiter(20), requestOtp);
router.post('/verify-otp', limiter(40), verifyOtp);
router.get('/me', requireDelegate, getMe);
router.get('/workshops', requireDelegate, listWorkshops);
router.post('/workshops/:id/claim', requireDelegate, claimWorkshop);
router.get('/certificates', requireDelegate, listCertificates);
router.get('/certificates/:id/pdf', requireDelegate, downloadCertificate);

module.exports = router;
