const { pool } = require('../config/db');

const normalizeTicket = (ticket) => ticket && ({
  id: ticket.id,
  name: ticket.name,
  description: ticket.description,
  price: Number(ticket.price || 0),
  currency: ticket.currency,
  capacity: Number(ticket.capacity || 0),
  remaining: Number(ticket.remaining || 0),
  featured: Boolean(ticket.featured),
  active: Boolean(ticket.active),
});

const normalizeRegistration = (registration) => registration && ({
  id: registration.id,
  registrationId: registration.registration_id,
  fullName: registration.full_name,
  email: registration.email,
  phone: registration.phone,
  institution: registration.institution,
  country: registration.country,
  city: registration.city,
  designation: registration.designation,
  ticketTypeId: registration.ticket_type_id,
  ticketName: registration.ticket_name,
  ticketPrice: registration.ticket_price === undefined ? undefined : Number(registration.ticket_price || 0),
  ticketCurrency: registration.ticket_currency,
  paymentStatus: registration.payment_status,
  registrationStatus: registration.registration_status,
  qrCode: registration.qr_code,
  attendance: Boolean(registration.attendance),
  createdAt: registration.created_at,
});

const listTickets = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? '' : 'WHERE active = TRUE';
  const [rows] = await pool.query(`SELECT * FROM ticket_types ${where} ORDER BY featured DESC, price ASC`);
  return rows.map(normalizeTicket);
};

const findTicketById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM ticket_types WHERE id = ? LIMIT 1', [id]);
  return normalizeTicket(rows[0]);
};

const createTicket = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO ticket_types (name, description, price, currency, capacity, remaining, featured, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.description || null,
      Number(data.price || 0),
      data.currency || 'INR',
      Number(data.capacity || 0),
      Number(data.remaining ?? data.capacity ?? 0),
      Boolean(data.featured),
      data.active === undefined ? true : Boolean(data.active),
    ]
  );
  return findTicketById(result.insertId);
};

const nextRegistrationId = async (connection) => {
  const [rows] = await connection.query('SELECT COUNT(*) AS count FROM registrations');
  return `GHC2026-${String(Number(rows[0].count || 0) + 1).padStart(4, '0')}`;
};

const listRegistrations = async ({ limit = 50, offset = 0 } = {}) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.name AS ticket_name, t.price AS ticket_price, t.currency AS ticket_currency
     FROM registrations r
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  return rows.map(normalizeRegistration);
};

const findRegistrationById = async (id) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.name AS ticket_name, t.price AS ticket_price, t.currency AS ticket_currency
     FROM registrations r
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE r.id = ? OR r.registration_id = ?
     LIMIT 1`,
    [id, id]
  );
  return normalizeRegistration(rows[0]);
};

const createRegistration = async (data, qrFactory) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[ticket]] = await connection.query('SELECT * FROM ticket_types WHERE id = ? AND active = TRUE FOR UPDATE', [data.ticketTypeId]);
    if (!ticket) {
      const error = new Error('Ticket type not found');
      error.statusCode = 404;
      throw error;
    }

    if (Number(ticket.remaining || 0) <= 0) {
      const error = new Error('Ticket type is sold out');
      error.statusCode = 400;
      throw error;
    }

    const registrationId = await nextRegistrationId(connection);
    const qrCode = qrFactory(registrationId);

    const [result] = await connection.query(
      `INSERT INTO registrations
        (registration_id, full_name, email, phone, institution, country, city, designation, ticket_type_id, payment_status, registration_status, qr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?)`,
      [
        registrationId,
        data.fullName,
        data.email,
        data.phone || null,
        data.institution || null,
        data.country || null,
        data.city || null,
        data.designation || null,
        data.ticketTypeId,
        qrCode,
      ]
    );

    await connection.query('UPDATE ticket_types SET remaining = GREATEST(remaining - 1, 0) WHERE id = ?', [data.ticketTypeId]);
    await connection.commit();
    return findRegistrationById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const setStatus = async (id, status) => {
  await pool.query('UPDATE registrations SET registration_status = ? WHERE id = ? OR registration_id = ?', [status, id, id]);
  return findRegistrationById(id);
};

const checkIn = async (id, attendance = true) => {
  await pool.query('UPDATE registrations SET attendance = ? WHERE id = ? OR registration_id = ?', [Boolean(attendance), id, id]);
  return findRegistrationById(id);
};

const stats = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(payment_status = 'paid') AS paid,
      SUM(payment_status = 'pending') AS pending,
      SUM(attendance = TRUE) AS attendance,
      SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(t.price, 0) ELSE 0 END) AS revenue
    FROM registrations r
    LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
  `);

  return {
    total: Number(rows[0].total || 0),
    paid: Number(rows[0].paid || 0),
    pending: Number(rows[0].pending || 0),
    attendance: Number(rows[0].attendance || 0),
    revenue: Number(rows[0].revenue || 0),
  };
};

module.exports = {
  checkIn,
  createRegistration,
  createTicket,
  findRegistrationById,
  findTicketById,
  listRegistrations,
  listTickets,
  setStatus,
  stats,
};
