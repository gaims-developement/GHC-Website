const Registration = require('../models/registrationModel');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { sendMail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');
const { applyEventScope, getCurrentEventId } = require('../utils/eventScope');

const validRegistrationStatuses = ['pending', 'approved', 'rejected'];
const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const generateQrSvg = (registrationId) => {
  const cells = Array.from({ length: 121 }, (_, index) => {
    const x = index % 11;
    const y = Math.floor(index / 11);
    const char = registrationId.charCodeAt(index % registrationId.length);
    const filled = (char + x * 7 + y * 13 + index) % 3 !== 0;
    return filled ? `<rect x="${x * 8}" y="${y * 8}" width="7" height="7" rx="1"/>` : '';
  }).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#fff"/><g fill="#081B33" transform="translate(16 16)">${cells}</g><text x="60" y="112" text-anchor="middle" font-size="8" font-family="Arial" fill="#081B33">${registrationId}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
};

const validateRegistration = (payload) => {
  if (!payload.fullName?.trim()) return 'Full name is required';
  if (!payload.email?.trim()) return 'Email is required';
  if (!payload.ticketTypeId) return 'Registration category is required';
  return null;
};

const log = (req, action, module, recordId, metadata = null) =>
  ActivityLog.logActivity({ userId: req.user?.id || null, action, module, recordId: String(recordId), metadata }).catch(() => {});

const listRegistrations = asyncHandler(async (req, res) => {
  const registrations = await Registration.listRegistrations({
    limit: req.query.limit || 50,
    offset: req.query.offset || 0,
    search: req.query.search,
    paymentStatus: req.query.paymentStatus,
    categoryId: req.query.categoryId,
    attendanceStatus: req.query.attendanceStatus,
    institution: req.query.institution,
    country: req.query.country,
    date: req.query.date,
    req,
  });
  const stats = await Registration.stats(req);
  res.json({ registrations, stats });
});

const registrationDashboard = asyncHandler(async (req, res) => {
  const clauses = [];
  const params = [];
  applyEventScope(clauses, params, req, 'event_id');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const categoryClauses = [];
  const categoryParams = [];
  applyEventScope(categoryClauses, categoryParams, req, 'r.event_id');
  const categoryWhere = categoryClauses.length ? `WHERE ${categoryClauses.join(' AND ')}` : '';
  const [[stats]] = await pool.query(`
    SELECT COUNT(*) AS totalRegistrations,
      SUM(DATE(created_at) = CURDATE()) AS todaysRegistrations,
      SUM(payment_status = 'paid') AS paidRegistrations,
      SUM(payment_status = 'pending') AS pendingPayments,
      SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(amount_paid, 0) ELSE 0 END) AS revenueCollected,
      SUM(attendance_status = 'checked_in' AND DATE(updated_at) = CURDATE()) AS checkinsToday
    FROM registrations
    ${where}
  `, params);
  const [[topCategory]] = await pool.query(`
    SELECT COALESCE(rc.name, tt.name, 'Unassigned') AS name, COUNT(*) AS total
    FROM registrations r
    LEFT JOIN registration_categories rc ON rc.id = r.category_id
    LEFT JOIN ticket_types tt ON tt.id = r.ticket_type_id
    ${categoryWhere}
    GROUP BY name ORDER BY total DESC LIMIT 1
  `, categoryParams);
  res.json({
    stats: {
      totalRegistrations: Number(stats.totalRegistrations || 0),
      todaysRegistrations: Number(stats.todaysRegistrations || 0),
      paidRegistrations: Number(stats.paidRegistrations || 0),
      pendingPayments: Number(stats.pendingPayments || 0),
      revenueCollected: Number(stats.revenueCollected || 0),
      checkinsToday: Number(stats.checkinsToday || 0),
      topRegistrationCategory: topCategory?.name || 'None',
    },
    recentRegistrations: await Registration.listRegistrations({ limit: 8, offset: 0, req }),
  });
});

const getRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findRegistrationById(req.params.id, req);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  return res.json({ registration });
});

const createRegistration = asyncHandler(async (req, res) => {
  const payload = {
    fullName: req.body.fullName || req.body.full_name,
    email: req.body.email,
    phone: req.body.phone,
    gender: req.body.gender,
    institution: req.body.institution,
    country: req.body.country,
    state: req.body.state,
    city: req.body.city,
    designation: req.body.designation,
    ticketTypeId: req.body.ticketTypeId || req.body.ticket_type_id || req.body.categoryId || req.body.category_id,
    categoryId: req.body.categoryId || req.body.category_id,
  };
  const error = validateRegistration(payload);
  if (error) return res.status(400).json({ message: error });

  const registration = await Registration.createRegistration(payload, generateQrSvg, req);
  log(req, 'created_registration', 'registrations', registration.id);
  if (process.env.SMTP_HOST) {
    sendMail({
      to: registration.email,
      subject: 'GHC 2026 registration received',
      text: `Your registration ${registration.registrationId} has been received.`,
      html: `<p>Dear ${registration.fullName},</p><p>Your GHC 2026 registration has been received.</p><p><strong>Registration ID:</strong> ${registration.registrationId}</p>`,
    }).catch(() => {});
  }
  return res.status(201).json({ registration });
});

const updateRegistration = asyncHandler(async (req, res) => {
  const clauses = ['(id = ? OR registration_id = ?)'];
  const params = [req.params.id, req.params.id];
  applyEventScope(clauses, params, req, 'event_id');
  await pool.query(
    `UPDATE registrations SET full_name = ?, email = ?, phone = ?, gender = ?, institution = ?, designation = ?,
      city = ?, state = ?, country = ?, category_id = ?, ticket_type_id = ?, payment_status = ?, amount_paid = ?, transaction_id = ?
     WHERE ${clauses.join(' AND ')}`,
    [
      req.body.fullName || req.body.full_name,
      req.body.email,
      req.body.phone || null,
      req.body.gender || null,
      req.body.institution || null,
      req.body.designation || null,
      req.body.city || null,
      req.body.state || null,
      req.body.country || null,
      req.body.categoryId || req.body.category_id || null,
      req.body.ticketTypeId || req.body.ticket_type_id || req.body.categoryId || null,
      req.body.paymentStatus || req.body.payment_status || 'pending',
      Number(req.body.amountPaid || req.body.amount_paid || 0),
      req.body.transactionId || req.body.transaction_id || null,
      ...params,
    ]
  );
  log(req, 'edited_registration', 'registrations', req.params.id);
  res.json({ registration: await Registration.findRegistrationById(req.params.id, req) });
});

const updateRegistrationStatus = asyncHandler(async (req, res) => {
  if (!validRegistrationStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid registration status' });
  const registration = await Registration.setStatus(req.params.id, req.body.status, req);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  log(req, 'updated_registration_status', 'registrations', req.params.id, { status: req.body.status });
  return res.json({ registration });
});

const cancelRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.setStatus(req.params.id, 'rejected', req);
  log(req, 'cancelled_registration', 'registrations', req.params.id);
  res.json({ registration });
});

const refundRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.findRegistrationById(req.params.id, req);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  await pool.query("UPDATE registrations SET payment_status = 'refunded' WHERE id = ?", [registration.id]);
  await pool.query("UPDATE payments SET status = 'refunded' WHERE registration_id = ? AND event_id <=> ?", [registration.id, getCurrentEventId(req)]);
  log(req, 'refunded_registration', 'payments', req.params.id, { reason: req.body.reason || null });
  res.json({ registration: await Registration.findRegistrationById(req.params.id, req) });
});

const deleteRegistration = asyncHandler(async (req, res) => {
  const clauses = ['(id = ? OR registration_id = ?)'];
  const params = [req.params.id, req.params.id];
  applyEventScope(clauses, params, req, 'event_id');
  await pool.query(`DELETE FROM registrations WHERE ${clauses.join(' AND ')}`, params);
  log(req, 'deleted_registration', 'registrations', req.params.id);
  res.status(204).send();
});

const checkInRegistration = asyncHandler(async (req, res) => {
  const registration = await Registration.checkIn(req.params.id, req.body.attendance === undefined ? true : toBoolean(req.body.attendance), req);
  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  log(req, 'manual_checkin_update', 'checkin', req.params.id);
  return res.json({ registration });
});

const listCategories = asyncHandler(async (_req, res) => {
  const [categories] = await pool.query('SELECT * FROM registration_categories ORDER BY is_active DESC, name ASC');
  res.json({ categories });
});

const saveCategory = asyncHandler(async (req, res) => {
  const payload = [req.body.name, req.body.description || null, Number(req.body.price || 0), req.body.currency || 'INR', Number(req.body.capacity || 0), req.body.isActive !== false];
  let id = req.params.id;
  if (id) await pool.query('UPDATE registration_categories SET name = ?, description = ?, price = ?, currency = ?, capacity = ?, is_active = ? WHERE id = ?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO registration_categories (name, description, price, currency, capacity, is_active) VALUES (?, ?, ?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  log(req, req.params.id ? 'updated_registration_category' : 'created_registration_category', 'registrations', id);
  res.json({ id });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM registration_categories WHERE id = ?', [req.params.id]);
  res.status(204).send();
});

const listCoupons = asyncHandler(async (_req, res) => {
  const [coupons] = await pool.query('SELECT * FROM discount_codes ORDER BY is_active DESC, expiry_date ASC, code ASC');
  res.json({ coupons });
});

const saveCoupon = asyncHandler(async (req, res) => {
  const payload = [String(req.body.code || '').trim().toUpperCase(), req.body.discountType || 'percentage', Number(req.body.value || 0), Number(req.body.usageLimit || 0), req.body.expiryDate || null, req.body.isActive !== false];
  let id = req.params.id;
  if (id) await pool.query('UPDATE discount_codes SET code = ?, discount_type = ?, value = ?, usage_limit = ?, expiry_date = ?, is_active = ? WHERE id = ?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO discount_codes (code, discount_type, value, usage_limit, expiry_date, is_active) VALUES (?, ?, ?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  log(req, req.params.id ? 'updated_coupon' : 'created_coupon', 'coupons', id);
  res.json({ id });
});

const deactivateCoupon = asyncHandler(async (req, res) => {
  await pool.query('UPDATE discount_codes SET is_active = FALSE WHERE id = ?', [req.params.id]);
  log(req, 'deactivated_coupon', 'coupons', req.params.id);
  res.json({ id: Number(req.params.id), isActive: false });
});

const listBadges = asyncHandler(async (req, res) => {
  res.json({ badges: await Registration.listRegistrations({ limit: req.query.limit || 100, offset: req.query.offset || 0, req }) });
});

const markBadgeGenerated = asyncHandler(async (req, res) => {
  const clauses = ['(id = ? OR registration_id = ?)'];
  const params = [req.params.id, req.params.id];
  applyEventScope(clauses, params, req, 'event_id');
  await pool.query(`UPDATE registrations SET badge_generated = TRUE WHERE ${clauses.join(' AND ')}`, params);
  log(req, 'generated_badge', 'badges', req.params.id);
  res.json({ id: req.params.id });
});

const listTickets = asyncHandler(async (_req, res) => res.json({ tickets: await Registration.listTickets() }));
const listAdminTickets = asyncHandler(async (_req, res) => res.json({ tickets: await Registration.listTickets({ includeInactive: true }) }));
const createTicket = asyncHandler(async (req, res) => res.status(201).json({ ticket: await Registration.createTicket(req.body) }));
const updateTicket = asyncHandler(async (req, res) => res.json({ ticket: await Registration.updateTicket(req.params.id, req.body) }));
const deleteTicket = asyncHandler(async (req, res) => res.json({ deleted: await Registration.deleteTicket(req.params.id) }));

const registrationReports = asyncHandler(async (req, res) => {
  const series = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows.map((row) => ({ label: row.label || 'Unknown', value: Number(row.value || 0) }));
  };
  const rClauses = [];
  const rParams = [];
  applyEventScope(rClauses, rParams, req, 'r.event_id');
  const rWhere = rClauses.length ? `WHERE ${rClauses.join(' AND ')}` : '';
  const pClauses = [];
  const pParams = [];
  applyEventScope(pClauses, pParams, req, 'event_id');
  pClauses.push("status = 'paid'");
  const paidWhere = `WHERE ${pClauses.join(' AND ')}`;
  const [paymentMethods] = await pool.query('SELECT * FROM payment_methods ORDER BY name ASC');
  res.json({
    charts: {
      registrationsByDay: await series(`SELECT DATE(r.created_at) AS label, COUNT(*) AS value FROM registrations r ${rWhere} GROUP BY DATE(r.created_at) ORDER BY label ASC LIMIT 60`, rParams),
      revenueByDay: await series(`SELECT DATE(created_at) AS label, SUM(amount) AS value FROM payments ${paidWhere} GROUP BY DATE(created_at) ORDER BY label ASC LIMIT 60`, [...pParams]),
      registrationsByCategory: await series(`SELECT COALESCE(rc.name, tt.name, 'Unassigned') AS label, COUNT(*) AS value FROM registrations r LEFT JOIN registration_categories rc ON rc.id = r.category_id LEFT JOIN ticket_types tt ON tt.id = r.ticket_type_id ${rWhere} GROUP BY label ORDER BY value DESC`, rParams),
      institutionDistribution: await series(`SELECT COALESCE(r.institution, 'Unknown') AS label, COUNT(*) AS value FROM registrations r ${rWhere} GROUP BY label ORDER BY value DESC LIMIT 20`, rParams),
      stateDistribution: await series(`SELECT COALESCE(r.state, 'Unknown') AS label, COUNT(*) AS value FROM registrations r ${rWhere} GROUP BY label ORDER BY value DESC LIMIT 20`, rParams),
      countryDistribution: await series(`SELECT COALESCE(r.country, 'Unknown') AS label, COUNT(*) AS value FROM registrations r ${rWhere} GROUP BY label ORDER BY value DESC LIMIT 20`, rParams),
      attendanceRate: await series(`SELECT r.attendance_status AS label, COUNT(*) AS value FROM registrations r ${rWhere} GROUP BY r.attendance_status`, rParams),
    },
    paymentMethods,
  });
});

const exportRegistrationsCsv = asyncHandler(async (req, res) => {
  const registrations = await Registration.listRegistrations({ limit: 10000, offset: 0, req });
  const header = ['registration_id', 'full_name', 'email', 'phone', 'institution', 'category', 'status', 'payment_status', 'attendance_status'];
  const rows = registrations.map((item) => [item.registrationId, item.fullName, item.email, item.phone, item.institution, item.ticketName, item.registrationStatus, item.paymentStatus, item.attendanceStatus]);
  const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-registrations.csv"');
  res.send(csv);
});

const exportRegistrationsExcel = asyncHandler(async (req, res) => {
  const registrations = await Registration.listRegistrations({ limit: 10000, offset: 0, req });
  const rows = registrations.map((item) => `<tr><td>${item.registrationId || ''}</td><td>${item.fullName || ''}</td><td>${item.email || ''}</td><td>${item.phone || ''}</td><td>${item.institution || ''}</td><td>${item.ticketName || ''}</td><td>${item.registrationStatus || ''}</td><td>${item.paymentStatus || ''}</td><td>${item.attendanceStatus || ''}</td></tr>`).join('');
  res.setHeader('Content-Type', 'application/vnd.ms-excel');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-registrations.xls"');
  res.send(`<html><body><table><thead><tr><th>Registration ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Institution</th><th>Category</th><th>Status</th><th>Payment</th><th>Attendance</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
});

module.exports = {
  cancelRegistration,
  checkInRegistration,
  createRegistration,
  createTicket,
  deactivateCoupon,
  deleteCategory,
  deleteRegistration,
  deleteTicket,
  exportRegistrationsCsv,
  exportRegistrationsExcel,
  getRegistration,
  listAdminTickets,
  listBadges,
  listCategories,
  listCoupons,
  listRegistrations,
  listTickets,
  markBadgeGenerated,
  refundRegistration,
  registrationDashboard,
  registrationReports,
  saveCategory,
  saveCoupon,
  updateRegistration,
  updateRegistrationStatus,
  updateTicket,
};
