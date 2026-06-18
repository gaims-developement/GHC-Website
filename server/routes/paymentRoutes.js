const router = require('express').Router();
const {
  createPaymentIntent,
  createOrder,
  getInvoice,
  getTicket,
  listPayments,
  refundPayment,
  validateCoupon,
  verifyPayment,
} = require('../controllers/paymentController');
const { requireAuth, requirePermission } = require('../middleware/authMiddleware');

const canManagePayments = requirePermission('manage_payments', 'analytics.view');

router.post('/create-payment-intent', createPaymentIntent);
router.post('/payments/create-order', createOrder);
router.post('/payments/verify', verifyPayment);
router.get('/payments/:id/invoice', getInvoice);
router.get('/payments/:id/ticket', getTicket);
router.get('/payments', requireAuth, canManagePayments, listPayments);
router.post('/payments/refund', requireAuth, canManagePayments, refundPayment);
router.post('/coupons/validate', validateCoupon);

module.exports = router;
