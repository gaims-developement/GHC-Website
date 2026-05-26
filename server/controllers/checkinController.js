const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const parseScan = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.registrationId || value.registration_id || value.id;
  const text = String(value).trim();
  try {
    const parsed = JSON.parse(text);
    return parsed.registrationId || parsed.registration_id || parsed.id || text;
  } catch {
    return text;
  }
};

const normalizeRegistration = (row) => row && ({
  id: row.id,
  registrationId: row.registration_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  ticketName: row.ticket_name,
  ticketTypeId: row.ticket_type_id,
  paymentStatus: row.payment_status,
  registrationStatus: row.registration_status,
  attendance: Boolean(row.attendance),
  qrCode: row.qr_code,
});

const historyFor = async (registrationId) => {
  const [rows] = await pool.query(
    `SELECT al.*, w.title AS workshop_title, u.name AS verified_by_name
     FROM attendance_logs al
     LEFT JOIN workshops w ON w.id = al.workshop_id
     LEFT JOIN users u ON u.id = al.verified_by
     WHERE al.registration_id = ?
     ORDER BY al.created_at DESC
     LIMIT 20`,
    [registrationId]
  );
  return rows.map((row) => ({
    id: row.id,
    checkinTime: row.checkin_time,
    checkoutTime: row.checkout_time,
    workshopId: row.workshop_id,
    workshopTitle: row.workshop_title,
    verifiedBy: row.verified_by_name,
    createdAt: row.created_at,
  }));
};

const listCheckins = asyncHandler(async (_req, res) => {
  const [logs] = await pool.query(`
    SELECT al.*, r.registration_id AS registration_code, r.full_name, r.email, t.name AS ticket_name, w.title AS workshop_title
    FROM attendance_logs al
    LEFT JOIN registrations r ON r.id = al.registration_id
    LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
    LEFT JOIN workshops w ON w.id = al.workshop_id
    ORDER BY al.created_at DESC
    LIMIT 50
  `);

  const [[stats]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(attendance = TRUE) AS checked_in,
      SUM(attendance = FALSE) AS pending_arrivals
    FROM registrations
  `);

  res.json({
    stats: {
      total: Number(stats.total || 0),
      checkedIn: Number(stats.checked_in || 0),
      pendingArrivals: Number(stats.pending_arrivals || 0),
    },
    logs: logs.map((row) => ({
      id: row.id,
      registrationId: row.registration_id,
      registrationCode: row.registration_code,
      fullName: row.full_name,
      email: row.email,
      ticketName: row.ticket_name,
      workshopTitle: row.workshop_title,
      checkinTime: row.checkin_time,
      checkoutTime: row.checkout_time,
      createdAt: row.created_at,
    })),
  });
});

const scan = asyncHandler(async (req, res) => {
  const registrationCode = parseScan(req.body.qrData || req.body.registrationId || req.body.registration_id);
  if (!registrationCode) return res.status(400).json({ message: 'Registration QR data is required' });

  const [[registration]] = await pool.query(
    `SELECT r.*, t.name AS ticket_name
     FROM registrations r
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE r.id = ? OR r.registration_id = ?
     LIMIT 1`,
    [registrationCode, registrationCode]
  );

  if (!registration) return res.status(404).json({ message: 'Registration not found' });
  if (registration.payment_status !== 'paid') return res.status(400).json({ message: 'Payment is not complete', registration: normalizeRegistration(registration) });
  if (registration.registration_status !== 'approved') return res.status(400).json({ message: 'Registration is not approved', registration: normalizeRegistration(registration) });

  await pool.query('UPDATE registrations SET attendance = TRUE WHERE id = ?', [registration.id]);
  await pool.query(
    `INSERT INTO attendance_logs (registration_id, checkin_time, workshop_id, verified_by)
     VALUES (?, NOW(), ?, ?)`,
    [registration.id, req.body.workshopId || req.body.workshop_id || null, req.user?.id || null]
  );
  await pool.query(
    `INSERT INTO analytics_events (event_type, user_id, registration_id, metadata)
     VALUES ('checkin_scan', ?, ?, ?)`,
    [req.user?.id || null, registration.id, JSON.stringify({ source: 'admin_checkin', workshopId: req.body.workshopId || null })]
  );

  const history = await historyFor(registration.id);
  res.json({
    registration: normalizeRegistration({ ...registration, attendance: true }),
    workshopAccess: registration.payment_status === 'paid' && registration.registration_status === 'approved',
    history,
  });
});

module.exports = { listCheckins, scan };
