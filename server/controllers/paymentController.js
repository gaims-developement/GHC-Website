const PaymentService = require('../services/paymentService');
const ActivityLog = require('../models/activityLogModel');
const asyncHandler = require('../utils/asyncHandler');
const Stripe = require('stripe');

const createPaymentIntent = asyncHandler(async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ message: 'Stripe secret key is not configured' });
  }

  const amount = Number(req.body.amount);
  const currency = String(req.body.currency || 'usd').toLowerCase();

  if (!Number.isInteger(amount) || amount < 50) {
    return res.status(400).json({ message: 'Amount must be an integer of at least 50 cents' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

const createOrder = asyncHandler(async (req, res) => {
  const result = await PaymentService.createOrder({
    registrationId: req.body.registrationId || req.body.registration_id,
    couponCode: req.body.couponCode || req.body.coupon_code,
    provider: req.body.provider || 'razorpay',
    req,
  });
  res.status(201).json(result);
});

const verifyPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.verifyPayment({
    provider: req.body.provider || 'razorpay',
    orderId: req.body.razorpay_order_id || req.body.orderId || req.body.providerOrderId,
    paymentId: req.body.razorpay_payment_id || req.body.paymentId || req.body.providerPaymentId,
    signature: req.body.razorpay_signature || req.body.signature,
    req,
  });
  res.json(result);
});

const listPayments = asyncHandler(async (req, res) => {
  const result = await PaymentService.listPayments({
    status: req.query.status,
    search: req.query.search,
    req,
  });
  res.json(result);
});

const refundPayment = asyncHandler(async (req, res) => {
  const payment = await PaymentService.refundPayment({
    paymentId: req.body.paymentId || req.body.payment_id || req.body.providerPaymentId,
    amount: req.body.amount,
    req,
  });
  await ActivityLog.logActivity({
    userId: req.user?.id || null,
    action: 'refunded_payment',
    module: 'payments',
    recordId: String(req.body.paymentId || req.body.payment_id || req.body.providerPaymentId),
    metadata: { amount: req.body.amount || null },
  });
  res.json({ payment });
});

const validateCoupon = asyncHandler(async (req, res) => {
  const result = await PaymentService.validateCoupon({
    code: req.body.code,
    ticketTypeId: req.body.ticketTypeId || req.body.ticket_type_id,
    registrationId: req.body.registrationId || req.body.registration_id,
    req,
  });

  if (!result.coupon) return res.status(404).json({ message: 'Coupon not valid', totals: result.totals });
  res.json({
    coupon: {
      code: result.coupon.code,
      discountType: result.coupon.discount_type,
      discountValue: Number(result.coupon.discount_value || 0),
    },
    totals: result.totals,
  });
});

const getInvoice = asyncHandler(async (req, res) => {
  const buffer = await PaymentService.getInvoice(req.params.id, req);
  if (!buffer) return res.status(404).json({ message: 'Invoice not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ghc-invoice-${req.params.id}.pdf"`);
  return res.send(buffer);
});

const getTicket = asyncHandler(async (req, res) => {
  const buffer = await PaymentService.getTicket(req.params.id, req);
  if (!buffer) return res.status(404).json({ message: 'Ticket not found' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ghc-ticket-${req.params.id}.pdf"`);
  return res.send(buffer);
});

module.exports = {
  createPaymentIntent,
  createOrder,
  getInvoice,
  getTicket,
  listPayments,
  refundPayment,
  validateCoupon,
  verifyPayment,
};
