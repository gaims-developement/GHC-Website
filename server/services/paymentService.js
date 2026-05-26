const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Razorpay = require('razorpay');
const { pool } = require('../config/db');
const { sendMail } = require('./mailService');

const GST_RATE = Number(process.env.GST_RATE || 0.18);
const DEFAULT_PROVIDER = 'razorpay';

const toNumber = (value) => Number(value || 0);
const toMoney = (value) => Math.max(0, Number(Number(value || 0).toFixed(2)));

class RazorpayProvider {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
    this.client = this.keyId && this.keySecret ? new Razorpay({ key_id: this.keyId, key_secret: this.keySecret }) : null;
  }

  async createOrder({ amount, currency, receipt, notes }) {
    if (!this.client) {
      const error = new Error('Razorpay keys are not configured');
      error.statusCode = 503;
      throw error;
    }

    return this.client.orders.create({
      amount: Math.round(amount * 100),
      currency,
      receipt,
      notes,
    });
  }

  verifySignature({ orderId, paymentId, signature }) {
    if (!this.keySecret) return false;
    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', this.keySecret).update(body).digest('hex');
    const actual = Buffer.from(signature || '');
    const expectedBuffer = Buffer.from(expected);
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(expectedBuffer, actual);
  }

  async refund({ paymentId, amount }) {
    if (!this.client) {
      const error = new Error('Razorpay keys are not configured');
      error.statusCode = 503;
      throw error;
    }

    return this.client.payments.refund(paymentId, amount ? { amount: Math.round(amount * 100) } : {});
  }
}

class StripeProvider {
  createOrder() {
    const error = new Error('Stripe provider is not implemented yet');
    error.statusCode = 501;
    throw error;
  }
}

const providers = {
  razorpay: new RazorpayProvider(),
  stripe: new StripeProvider(),
};

const getProvider = (provider = DEFAULT_PROVIDER) => {
  const selected = providers[String(provider).toLowerCase()];
  if (!selected) {
    const error = new Error('Unsupported payment provider');
    error.statusCode = 400;
    throw error;
  }
  return selected;
};

const normalizePayment = (payment) => payment && ({
  id: payment.id,
  registrationId: payment.registration_id,
  registrationCode: payment.registration_code,
  fullName: payment.full_name,
  email: payment.email,
  ticketTypeId: payment.ticket_type_id,
  ticketName: payment.ticket_name,
  paymentProvider: payment.payment_provider,
  providerOrderId: payment.provider_order_id,
  providerPaymentId: payment.provider_payment_id,
  amount: toNumber(payment.amount),
  currency: payment.currency,
  status: payment.status,
  receiptUrl: payment.receipt_url,
  invoiceUrl: payment.invoice_url,
  createdAt: payment.created_at,
});

const paymentSelect = `
  SELECT p.*, r.registration_id AS registration_code, r.full_name, r.email, t.name AS ticket_name
  FROM payments p
  LEFT JOIN registrations r ON r.id = p.registration_id
  LEFT JOIN ticket_types t ON t.id = p.ticket_type_id
`;

const findRegistrationWithTicket = async (registrationId) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.name AS ticket_name, t.price AS ticket_price, t.currency AS ticket_currency
     FROM registrations r
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE r.id = ? OR r.registration_id = ?
     LIMIT 1`,
    [registrationId, registrationId]
  );
  return rows[0];
};

const calculateDiscount = (subtotal, coupon) => {
  if (!coupon) return 0;
  if (coupon.discount_type === 'percent') return toMoney(subtotal * (toNumber(coupon.discount_value) / 100));
  return Math.min(toMoney(coupon.discount_value), subtotal);
};

const findValidCoupon = async (code) => {
  if (!code) return null;
  const [rows] = await pool.query(
    `SELECT * FROM coupons
     WHERE UPPER(code) = UPPER(?) AND active = TRUE AND (max_uses IS NULL OR used_count < max_uses)
     LIMIT 1`,
    [code.trim()]
  );
  return rows[0] || null;
};

const priceForRegistration = async (registrationId, couponCode) => {
  const registration = await findRegistrationWithTicket(registrationId);
  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    throw error;
  }

  const subtotal = toMoney(registration.ticket_price);
  const coupon = await findValidCoupon(couponCode);
  const discount = calculateDiscount(subtotal, coupon);
  const taxableAmount = toMoney(subtotal - discount);
  const gst = toMoney(taxableAmount * GST_RATE);
  const total = toMoney(taxableAmount + gst);

  return {
    registration,
    coupon,
    totals: {
      subtotal,
      discount,
      gst,
      total,
      currency: registration.ticket_currency || 'INR',
    },
  };
};

const validateCoupon = async ({ code, ticketTypeId, registrationId }) => {
  let subtotal = 0;
  if (registrationId) {
    const pricing = await priceForRegistration(registrationId, code);
    return { coupon: pricing.coupon, totals: pricing.totals };
  }

  if (ticketTypeId) {
    const [[ticket]] = await pool.query('SELECT * FROM ticket_types WHERE id = ? LIMIT 1', [ticketTypeId]);
    subtotal = toMoney(ticket?.price);
  }

  const coupon = await findValidCoupon(code);
  const discount = calculateDiscount(subtotal, coupon);
  const taxableAmount = toMoney(subtotal - discount);
  const gst = toMoney(taxableAmount * GST_RATE);
  return {
    coupon,
    totals: { subtotal, discount, gst, total: toMoney(taxableAmount + gst), currency: 'INR' },
  };
};

const createOrder = async ({ registrationId, couponCode, provider = DEFAULT_PROVIDER }) => {
  const paymentProvider = getProvider(provider);
  const { registration, coupon, totals } = await priceForRegistration(registrationId, couponCode);
  const receipt = `GHC-${registration.registration_id || registration.id}`.slice(0, 40);
  const order = await paymentProvider.createOrder({
    amount: totals.total,
    currency: totals.currency,
    receipt,
    notes: {
      registration_id: String(registration.id),
      ticket_type_id: String(registration.ticket_type_id || ''),
      coupon_code: coupon?.code || '',
    },
  });

  const [result] = await pool.query(
    `INSERT INTO payments
      (registration_id, ticket_type_id, payment_provider, provider_order_id, amount, currency, status)
     VALUES (?, ?, ?, ?, ?, ?, 'created')`,
    [registration.id, registration.ticket_type_id, provider, order.id, totals.total, totals.currency]
  );

  const [[payment]] = await pool.query(`${paymentSelect} WHERE p.id = ? LIMIT 1`, [result.insertId]);
  return {
    payment: normalizePayment(payment),
    order,
    keyId: provider === 'razorpay' ? providers.razorpay.keyId : null,
    totals,
    coupon: coupon ? { code: coupon.code, discountType: coupon.discount_type, discountValue: toNumber(coupon.discount_value) } : null,
  };
};

const generateInvoiceBuffer = async ({ payment, registration }) => {
  const qrBuffer = await QRCode.toBuffer(JSON.stringify({
    registrationId: registration.registration_id,
    name: registration.full_name,
    ticket: registration.ticket_name,
  }));

  return new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);

  doc.fontSize(20).text('Global Healthcare Conclave 2026', { align: 'left' });
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor('#444').text('Payment Invoice');
  doc.moveDown(1.2);
  doc.fillColor('#111').fontSize(11);
  doc.text(`Name: ${registration.full_name || ''}`);
  doc.text(`Ticket: ${registration.ticket_name || ''}`);
  doc.text(`Amount: ${payment.currency} ${payment.amount}`);
  doc.text(`Transaction id: ${payment.provider_payment_id || payment.provider_order_id || ''}`);
  doc.text('GST: Placeholder');
  doc.text(`Registration ID: ${registration.registration_id || ''}`);
  doc.moveDown(1);
  doc.text('QR');
  doc.image(qrBuffer, { width: 110 });
  doc.end();
  });
};

const sendPaymentEmail = async ({ registration, payment, invoiceBuffer, qrBuffer }) => {
  if (!registration.email || !process.env.SMTP_HOST) return;
  await sendMail({
    to: registration.email,
    subject: 'GHC 2026 payment confirmation',
    text: `Your GHC registration ${registration.registration_id} is confirmed.`,
    html: `
      <p>Dear ${registration.full_name || 'Delegate'},</p>
      <p>Your registration and payment for Global Healthcare Conclave 2026 are confirmed.</p>
      <p><strong>Registration:</strong> ${registration.registration_id}</p>
      <p><strong>Ticket:</strong> ${registration.ticket_name || ''}</p>
      <p><strong>Amount:</strong> ${payment.currency} ${payment.amount}</p>
    `,
    attachments: [
      { filename: `GHC-${registration.registration_id}-invoice.pdf`, content: invoiceBuffer },
      { filename: `GHC-${registration.registration_id}-qr.png`, content: qrBuffer },
    ],
  });
};

const verifyPayment = async ({ provider = DEFAULT_PROVIDER, orderId, paymentId, signature }) => {
  const paymentProvider = getProvider(provider);
  if (!paymentProvider.verifySignature({ orderId, paymentId, signature })) {
    await pool.query("UPDATE payments SET status = 'failed', provider_payment_id = ? WHERE provider_order_id = ?", [paymentId || null, orderId]);
    const error = new Error('Payment verification failed');
    error.statusCode = 400;
    throw error;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      "UPDATE payments SET status = 'paid', provider_payment_id = ? WHERE provider_order_id = ?",
      [paymentId, orderId]
    );

    const [[payment]] = await connection.query(`${paymentSelect} WHERE p.provider_order_id = ? LIMIT 1`, [orderId]);
    if (!payment) {
      const error = new Error('Payment not found');
      error.statusCode = 404;
      throw error;
    }

    await connection.query(
      "UPDATE registrations SET payment_status = 'paid', registration_status = 'approved' WHERE id = ?",
      [payment.registration_id]
    );

    const [[registration]] = await connection.query(
      `SELECT r.*, t.name AS ticket_name
       FROM registrations r
       LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
       WHERE r.id = ? LIMIT 1`,
      [payment.registration_id]
    );

    const qrData = await QRCode.toDataURL(JSON.stringify({
      registrationId: registration.registration_id,
      name: registration.full_name,
      ticket: registration.ticket_name,
    }));
    await connection.query('UPDATE registrations SET qr_code = ? WHERE id = ?', [qrData, registration.id]);

    const invoiceUrl = `/api/payments/${payment.id}/invoice`;
    const receiptUrl = `/api/payments/${payment.id}/ticket`;
    await connection.query('UPDATE payments SET invoice_url = ?, receipt_url = ? WHERE id = ?', [invoiceUrl, receiptUrl, payment.id]);

    await connection.commit();

    const invoiceBuffer = await generateInvoiceBuffer({ payment, registration });
    const qrBuffer = Buffer.from(qrData.split(',')[1], 'base64');
    await sendPaymentEmail({ registration, payment, invoiceBuffer, qrBuffer }).catch(() => {});

    return {
      payment: normalizePayment({ ...payment, provider_payment_id: paymentId, status: 'paid', invoice_url: invoiceUrl, receipt_url: receiptUrl }),
      registration: {
        id: registration.id,
        registrationId: registration.registration_id,
        fullName: registration.full_name,
        email: registration.email,
        ticketName: registration.ticket_name,
        qrCode: qrData,
        paymentStatus: 'paid',
        registrationStatus: 'approved',
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const listPayments = async ({ status, search } = {}) => {
  const params = [];
  const where = [];
  if (status && status !== 'all') {
    where.push('p.status = ?');
    params.push(status);
  }
  if (search) {
    where.push('(r.full_name LIKE ? OR r.email LIKE ? OR p.provider_payment_id LIKE ? OR p.provider_order_id LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  const [rows] = await pool.query(
    `${paymentSelect} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.created_at DESC LIMIT 100`,
    params
  );
  const [statsRows] = await pool.query(`
    SELECT
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS revenue,
      SUM(status = 'paid') AS paid,
      SUM(status = 'refunded') AS refunds,
      SUM(status IN ('created', 'pending')) AS pending
    FROM payments
  `);

  return {
    payments: rows.map(normalizePayment),
    stats: {
      revenue: toNumber(statsRows[0].revenue),
      paid: toNumber(statsRows[0].paid),
      refunds: toNumber(statsRows[0].refunds),
      pending: toNumber(statsRows[0].pending),
    },
  };
};

const refundPayment = async ({ paymentId, amount }) => {
  const [[payment]] = await pool.query(`${paymentSelect} WHERE p.id = ? OR p.provider_payment_id = ? LIMIT 1`, [paymentId, paymentId]);
  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  await getProvider(payment.payment_provider).refund({ paymentId: payment.provider_payment_id, amount });
  await pool.query("UPDATE payments SET status = 'refunded' WHERE id = ?", [payment.id]);
  await pool.query("UPDATE registrations SET payment_status = 'refunded' WHERE id = ?", [payment.registration_id]);
  return normalizePayment({ ...payment, status: 'refunded' });
};

const getInvoice = async (id) => {
  const [[payment]] = await pool.query(`${paymentSelect} WHERE p.id = ? LIMIT 1`, [id]);
  if (!payment) return null;
  const [[registration]] = await pool.query(
    `SELECT r.*, t.name AS ticket_name
     FROM registrations r LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE r.id = ? LIMIT 1`,
    [payment.registration_id]
  );
  return generateInvoiceBuffer({ payment, registration });
};

const getTicket = async (id) => {
  const [[payment]] = await pool.query(`${paymentSelect} WHERE p.id = ? LIMIT 1`, [id]);
  if (!payment) return null;
  const [[registration]] = await pool.query(
    `SELECT r.*, t.name AS ticket_name
     FROM registrations r LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE r.id = ? LIMIT 1`,
    [payment.registration_id]
  );

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [320, 520], margin: 28 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(18).text('GHC 2026 Ticket', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Name: ${registration.full_name || ''}`);
    doc.text(`Ticket: ${registration.ticket_name || ''}`);
    doc.text(`Registration ID: ${registration.registration_id || ''}`);
    doc.text(`Transaction: ${payment.provider_payment_id || payment.provider_order_id || ''}`);
    doc.moveDown();
    doc.text('Show your QR code at check-in.');
    doc.end();
  });
};

module.exports = {
  createOrder,
  getInvoice,
  getTicket,
  listPayments,
  refundPayment,
  validateCoupon,
  verifyPayment,
};
