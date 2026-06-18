const { pool } = require('../config/db');
const { applyEventScope, getCurrentEventId } = require('../utils/eventScope');

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
  gender: registration.gender,
  institution: registration.institution,
  country: registration.country,
  state: registration.state,
  city: registration.city,
  designation: registration.designation,
  categoryId: registration.category_id,
  ticketTypeId: registration.ticket_type_id,
  ticketName: registration.ticket_name,
  ticketPrice: registration.ticket_price === undefined ? undefined : Number(registration.ticket_price || 0),
  ticketCurrency: registration.ticket_currency,
  paymentStatus: registration.payment_status,
  amountPaid: Number(registration.amount_paid || 0),
  transactionId: registration.transaction_id,
  registrationStatus: registration.registration_status,
  qrCode: registration.qr_code,
  badgeGenerated: Boolean(registration.badge_generated),
  attendanceStatus: registration.attendance_status || (registration.attendance ? 'checked_in' : 'registered'),
  attendance: Boolean(registration.attendance),
  eventId: registration.event_id,
  createdAt: registration.created_at,
  updatedAt: registration.updated_at,
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

const updateTicket = async (id, data) => {
  const existing = await findTicketById(id);
  if (!existing) return null;

  const nextCapacity = Number(data.capacity ?? existing.capacity ?? 0);
  const sold = Math.max(Number(existing.capacity || 0) - Number(existing.remaining || 0), 0);
  const nextRemaining = data.remaining === undefined
    ? Math.max(nextCapacity - sold, 0)
    : Math.min(Number(data.remaining || 0), nextCapacity);

  await pool.query(
    `UPDATE ticket_types
     SET name = ?, description = ?, price = ?, currency = ?, capacity = ?, remaining = ?, featured = ?, active = ?
     WHERE id = ?`,
    [
      data.name ?? existing.name,
      data.description ?? existing.description,
      Number(data.price ?? existing.price ?? 0),
      data.currency || existing.currency || 'INR',
      nextCapacity,
      nextRemaining,
      data.featured === undefined ? existing.featured : Boolean(data.featured),
      data.active === undefined ? existing.active : Boolean(data.active),
      id,
    ]
  );

  return findTicketById(id);
};

const deleteTicket = async (id) => {
  const [result] = await pool.query('DELETE FROM ticket_types WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const nextRegistrationId = async (connection, eventId = null) => {
  const params = [];
  const where = [];
  if (eventId) {
    where.push('event_id = ?');
    params.push(eventId);
  }
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM registrations ${where.length ? `WHERE ${where.join(' AND ')}` : ''}`, params);
  return `GHC2026-${String(Number(rows[0].count || 0) + 1).padStart(4, '0')}`;
};

const listRegistrations = async ({ limit = 50, offset = 0, search, paymentStatus, categoryId, attendanceStatus, institution, country, date, req } = {}) => {
  const where = [];
  const params = [];
  applyEventScope(where, params, req, 'r.event_id');
  if (search) {
    where.push('(r.registration_id LIKE ? OR r.full_name LIKE ? OR r.email LIKE ? OR r.phone LIKE ? OR r.institution LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term, term, term, term);
  }
  if (paymentStatus) {
    where.push('r.payment_status = ?');
    params.push(paymentStatus);
  }
  if (categoryId) {
    where.push('(r.category_id = ? OR r.ticket_type_id = ?)');
    params.push(categoryId, categoryId);
  }
  if (attendanceStatus) {
    where.push('r.attendance_status = ?');
    params.push(attendanceStatus);
  }
  if (institution) {
    where.push('r.institution LIKE ?');
    params.push(`%${institution}%`);
  }
  if (country) {
    where.push('r.country = ?');
    params.push(country);
  }
  if (date) {
    where.push('DATE(r.created_at) = ?');
    params.push(date);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT r.*, COALESCE(c.name, t.name) AS ticket_name, COALESCE(c.price, t.price) AS ticket_price, COALESCE(c.currency, t.currency) AS ticket_currency
     FROM registrations r
     LEFT JOIN registration_categories c ON c.id = r.category_id
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     ${whereSql}
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows.map(normalizeRegistration);
};

const findRegistrationById = async (id, req = null) => {
  const where = ['(r.id = ? OR r.registration_id = ?)'];
  const params = [id, id];
  applyEventScope(where, params, req, 'r.event_id');
  const [rows] = await pool.query(
    `SELECT r.*, COALESCE(c.name, t.name) AS ticket_name, COALESCE(c.price, t.price) AS ticket_price, COALESCE(c.currency, t.currency) AS ticket_currency
     FROM registrations r
     LEFT JOIN registration_categories c ON c.id = r.category_id
     LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
     WHERE ${where.join(' AND ')}
     LIMIT 1`,
    params
  );
  return normalizeRegistration(rows[0]);
};

const createRegistration = async (data, qrFactory, req = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const eventId = getCurrentEventId(req);

    let [[ticket]] = await connection.query('SELECT *, active AS is_active FROM ticket_types WHERE id = ? AND active = TRUE FOR UPDATE', [data.ticketTypeId]);
    if (!ticket) {
      [[ticket]] = await connection.query('SELECT *, is_active FROM registration_categories WHERE id = ? AND is_active = TRUE FOR UPDATE', [data.ticketTypeId]);
    }
    if (!ticket) {
      const error = new Error('Registration category not found');
      error.statusCode = 404;
      throw error;
    }

    const [[soldRow]] = await connection.query(
      `SELECT COUNT(*) AS sold FROM registrations WHERE COALESCE(category_id, ticket_type_id) = ?${eventId ? ' AND event_id = ?' : ''}`,
      eventId ? [data.ticketTypeId, eventId] : [data.ticketTypeId]
    );
    const remaining = ticket.remaining === undefined ? Number(ticket.capacity || 0) - Number(soldRow.sold || 0) : Number(ticket.remaining || 0);
    if (Number(ticket.capacity || 0) > 0 && remaining <= 0) {
      const error = new Error('Registration category is sold out');
      error.statusCode = 400;
      throw error;
    }

    const registrationId = await nextRegistrationId(connection, eventId);
    const qrCode = qrFactory(registrationId);

    const [result] = await connection.query(
      `INSERT INTO registrations
        (registration_id, full_name, email, phone, gender, institution, country, state, city, designation, ticket_type_id, category_id, payment_status, registration_status, qr_code, amount_paid, event_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, 0, ?)`,
      [
        registrationId,
        data.fullName,
        data.email,
        data.phone || null,
        data.gender || null,
        data.institution || null,
        data.country || null,
        data.state || null,
        data.city || null,
        data.designation || null,
        data.ticketTypeId,
        data.categoryId || data.ticketTypeId,
        qrCode,
        eventId,
      ]
    );

    await connection.query('UPDATE ticket_types SET remaining = GREATEST(remaining - 1, 0) WHERE id = ?', [data.ticketTypeId]);
    await connection.commit();
    return findRegistrationById(result.insertId, req);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const setStatus = async (id, status, req = null) => {
  const where = ['(id = ? OR registration_id = ?)'];
  const params = [status, id, id];
  applyEventScope(where, params, req, 'event_id');
  await pool.query(`UPDATE registrations SET registration_status = ? WHERE ${where.join(' AND ')}`, params);
  return findRegistrationById(id, req);
};

const checkIn = async (id, attendance = true, req = null) => {
  const where = ['(id = ? OR registration_id = ?)'];
  const params = [Boolean(attendance), attendance ? 'checked_in' : 'registered', id, id];
  applyEventScope(where, params, req, 'event_id');
  await pool.query(
    `UPDATE registrations SET attendance = ?, attendance_status = ? WHERE ${where.join(' AND ')}`,
    params
  );
  return findRegistrationById(id, req);
};

const stats = async (req = null) => {
  const where = [];
  const params = [];
  applyEventScope(where, params, req, 'r.event_id');
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(payment_status = 'paid') AS paid,
      SUM(payment_status = 'pending') AS pending,
      SUM(attendance = TRUE) AS attendance,
      SUM(CASE WHEN payment_status = 'paid' THEN COALESCE(r.amount_paid, c.price, t.price, 0) ELSE 0 END) AS revenue
    FROM registrations r
    LEFT JOIN registration_categories c ON c.id = r.category_id
    LEFT JOIN ticket_types t ON t.id = r.ticket_type_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
  `, params);

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
  deleteTicket,
  findRegistrationById,
  findTicketById,
  listRegistrations,
  listTickets,
  setStatus,
  stats,
  updateTicket,
};
