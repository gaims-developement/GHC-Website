const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const bool = (value) => value === true || value === 'true' || value === '1' || value === 1;
const num = (value) => Number(value || 0);
const clean = (value) => (value === undefined || value === null || value === '' ? null : value);
const slugify = (value = '') => String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || `event-${Date.now()}`;
const dateTime = (value) => clean(value) ? String(value).replace('T', ' ').slice(0, 19) : null;

const canPublish = (req) => req.user?.role === 'SUPER_ADMIN' || (req.user?.permissions || []).includes('publish_events');
const log = (req, action, module, recordId, metadata) =>
  ActivityLog.logActivity({ userId: req.user?.id, action, module, recordId: String(recordId || ''), metadata });

const uploadAsset = async (file) => {
  if (!file) return null;
  if (!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET)) return `/uploads/events/${file.filename}`;
  const result = await uploadToCloudinary(file.path, 'workshops', { resourceType: 'auto' });
  return result.secure_url;
};

const eventSelect = `
  SELECT events.*, event_types.name AS event_type_name, venues.name AS venue_name, venues.location AS venue_location,
    COALESCE(reg_counts.registered, 0) AS registered_count,
    COALESCE(reg_counts.waitlisted, 0) AS waitlist_count,
    COALESCE(payments.revenue, 0) AS revenue,
    COALESCE(feedback.average_rating, 0) AS average_rating
  FROM events
  LEFT JOIN event_types ON event_types.id = events.event_type_id
  LEFT JOIN venues ON venues.id = events.venue_id
  LEFT JOIN (
    SELECT event_id,
      SUM(attendance_status != 'waitlisted') AS registered,
      SUM(attendance_status = 'waitlisted') AS waitlisted
    FROM event_registrations GROUP BY event_id
  ) reg_counts ON reg_counts.event_id = events.id
  LEFT JOIN (
    SELECT event_id, SUM(CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END) AS revenue
    FROM event_payments GROUP BY event_id
  ) payments ON payments.event_id = events.id
  LEFT JOIN (
    SELECT event_id, AVG(rating) AS average_rating FROM event_feedback GROUP BY event_id
  ) feedback ON feedback.event_id = events.id
`;

const normalizeEvent = (row) => row && ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  description: row.description,
  eventTypeId: row.event_type_id,
  eventTypeName: row.event_type_name || row.event_type,
  bannerImage: row.banner_image,
  status: row.status,
  startDatetime: row.start_datetime,
  endDatetime: row.end_datetime,
  venueId: row.venue_id,
  venueName: row.venue_name,
  venueLocation: row.venue_location,
  capacity: num(row.capacity),
  registrationLimit: num(row.registration_limit),
  waitlistEnabled: Boolean(row.waitlist_enabled),
  registrationRequired: Boolean(row.registration_required),
  registrationOpen: Boolean(row.registration_open),
  manualApproval: Boolean(row.manual_approval),
  certificateEnabled: Boolean(row.certificate_enabled),
  fee: num(row.fee),
  prerequisites: row.prerequisites,
  learningOutcomes: row.learning_outcomes,
  registeredCount: num(row.registered_count),
  waitlistCount: num(row.waitlist_count),
  availableSeats: Math.max(num(row.capacity || row.registration_limit) - num(row.registered_count), 0),
  revenue: num(row.revenue),
  averageRating: Number(row.average_rating || 0).toFixed(1),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const dashboard = asyncHandler(async (_req, res) => {
  const [[metrics], [recentRegistrations]] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) AS totalEvents,
        SUM(status = 'published') AS publishedEvents,
        SUM(status = 'published' AND start_datetime >= NOW()) AS upcomingEvents,
        (SELECT COUNT(*) FROM event_registrations) AS registrations,
        (SELECT SUM(amount) FROM event_payments WHERE payment_status = 'paid') AS revenueGenerated,
        (SELECT COUNT(*) FROM event_certificates) AS certificatesIssued,
        (SELECT AVG(rating) FROM event_feedback) AS averageFeedbackScore
      FROM events
    `),
    pool.query(`
      SELECT event_registrations.*, events.title AS event_title, registrations.full_name, registrations.email
      FROM event_registrations
      LEFT JOIN events ON events.id = event_registrations.event_id
      LEFT JOIN registrations ON registrations.id = event_registrations.registration_id
      ORDER BY event_registrations.created_at DESC
      LIMIT 10
    `),
  ]);
  res.json({ metrics: metrics[0], recentRegistrations });
});

const listEvents = asyncHandler(async (req, res) => {
  const clauses = [];
  const params = [];
  if (!req.user && req.query.admin !== '1') clauses.push("events.status = 'published'");
  if (req.query.status && req.query.status !== 'all') {
    clauses.push('events.status = ?');
    params.push(req.query.status);
  }
  if (req.query.search) {
    clauses.push('(events.title LIKE ? OR events.description LIKE ? OR event_types.name LIKE ? OR venues.name LIKE ?)');
    const term = `%${req.query.search}%`;
    params.push(term, term, term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(`${eventSelect} ${where} ORDER BY events.start_datetime ASC, events.created_at DESC`, params);
  res.json({ events: rows.map(normalizeEvent) });
});

const getEvent = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${eventSelect} WHERE events.id = ? OR events.slug = ? LIMIT 1`, [req.params.id, req.params.id]);
  const event = normalizeEvent(rows[0]);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const [[facilitators], [resources], [registrations], [feedback], [certificates], [submissions]] = await Promise.all([
    pool.query('SELECT event_facilitators.*, speakers.name AS speaker_name FROM event_facilitators LEFT JOIN speakers ON speakers.id = event_facilitators.speaker_id WHERE event_id = ?', [event.id]),
    pool.query('SELECT * FROM event_resources WHERE event_id = ? ORDER BY created_at DESC', [event.id]),
    pool.query('SELECT event_registrations.*, registrations.full_name, registrations.email FROM event_registrations LEFT JOIN registrations ON registrations.id = event_registrations.registration_id WHERE event_id = ? ORDER BY created_at DESC', [event.id]),
    pool.query('SELECT * FROM event_feedback WHERE event_id = ? ORDER BY submitted_at DESC', [event.id]),
    pool.query('SELECT * FROM event_certificates WHERE event_id = ? ORDER BY generated_at DESC', [event.id]),
    pool.query('SELECT * FROM event_submissions WHERE event_id = ? ORDER BY score DESC, created_at DESC', [event.id]),
  ]);
  res.json({ event: { ...event, facilitators, resources, registrations, feedback, certificates, submissions } });
});

const saveEvent = asyncHandler(async (req, res) => {
  const banner = await uploadAsset(req.file);
  const payload = {
    title: req.body.title?.trim(),
    slug: req.body.slug?.trim() || slugify(req.body.title),
    description: clean(req.body.description),
    eventTypeId: clean(req.body.eventTypeId || req.body.event_type_id),
    bannerImage: banner || clean(req.body.bannerImage || req.body.banner_image),
    status: req.body.status || 'draft',
    startDatetime: dateTime(req.body.startDatetime || req.body.start_datetime),
    endDatetime: dateTime(req.body.endDatetime || req.body.end_datetime),
    venueId: clean(req.body.venueId || req.body.venue_id),
    capacity: num(req.body.capacity),
    registrationLimit: num(req.body.registrationLimit || req.body.registration_limit),
    waitlistEnabled: bool(req.body.waitlistEnabled || req.body.waitlist_enabled),
    registrationRequired: req.body.registrationRequired === undefined ? true : bool(req.body.registrationRequired || req.body.registration_required),
    registrationOpen: req.body.registrationOpen === undefined ? true : bool(req.body.registrationOpen || req.body.registration_open),
    manualApproval: bool(req.body.manualApproval || req.body.manual_approval),
    certificateEnabled: bool(req.body.certificateEnabled || req.body.certificate_enabled),
    fee: num(req.body.fee),
    prerequisites: clean(req.body.prerequisites),
    learningOutcomes: clean(req.body.learningOutcomes || req.body.learning_outcomes),
  };
  if (!payload.title) return res.status(400).json({ message: 'Event title is required' });
  if (payload.status === 'published' && !canPublish(req)) payload.status = 'draft';

  if (payload.venueId && payload.startDatetime && payload.endDatetime) {
    const [conflicts] = await pool.query(
      `SELECT id, title FROM events
       WHERE venue_id = ? AND id != ? AND status NOT IN ('cancelled', 'archived')
       AND start_datetime < ? AND end_datetime > ? LIMIT 1`,
      [payload.venueId, req.params.id || 0, payload.endDatetime, payload.startDatetime]
    );
    if (conflicts.length) return res.status(409).json({ message: `Venue conflict with ${conflicts[0].title}` });
  }

  if (req.params.id) {
    await pool.query(
      `UPDATE events SET title = ?, slug = ?, description = ?, event_type_id = ?, banner_image = COALESCE(?, banner_image),
       status = ?, start_datetime = ?, end_datetime = ?, venue_id = ?, capacity = ?, registration_limit = ?,
       waitlist_enabled = ?, registration_required = ?, registration_open = ?, manual_approval = ?, certificate_enabled = ?,
       fee = ?, prerequisites = ?, learning_outcomes = ? WHERE id = ?`,
      [payload.title, payload.slug, payload.description, payload.eventTypeId, payload.bannerImage, payload.status, payload.startDatetime,
        payload.endDatetime, payload.venueId, payload.capacity, payload.registrationLimit, payload.waitlistEnabled,
        payload.registrationRequired, payload.registrationOpen, payload.manualApproval, payload.certificateEnabled, payload.fee,
        payload.prerequisites, payload.learningOutcomes, req.params.id]
    );
    await log(req, 'updated_event', 'events', req.params.id, { status: payload.status });
    return getEvent(req, res);
  }
  const [result] = await pool.query(
    `INSERT INTO events (title, slug, description, event_type_id, banner_image, status, start_datetime, end_datetime, venue_id,
     capacity, registration_limit, waitlist_enabled, registration_required, registration_open, manual_approval, certificate_enabled,
     fee, prerequisites, learning_outcomes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [payload.title, payload.slug, payload.description, payload.eventTypeId, payload.bannerImage, payload.status, payload.startDatetime,
      payload.endDatetime, payload.venueId, payload.capacity, payload.registrationLimit, payload.waitlistEnabled,
      payload.registrationRequired, payload.registrationOpen, payload.manualApproval, payload.certificateEnabled, payload.fee,
      payload.prerequisites, payload.learningOutcomes]
  );
  req.params.id = result.insertId;
  await log(req, 'created_event', 'events', result.insertId, { status: payload.status });
  return getEvent(req, res);
});

const deleteEvent = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
  await log(req, 'deleted_event', 'events', req.params.id);
  res.json({ success: true });
});

const setEventStatus = (status) => asyncHandler(async (req, res) => {
  if (status === 'published' && !canPublish(req)) return res.status(403).json({ message: 'Publish permission is required' });
  await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, req.params.id]);
  await log(req, `${status}_event`, 'events', req.params.id);
  return getEvent(req, res);
});

const duplicateEvent = asyncHandler(async (req, res) => {
  const [[event]] = await pool.query('SELECT * FROM events WHERE id = ? LIMIT 1', [req.params.id]);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  const slug = `${slugify(event.title)}-${Date.now()}`;
  const [result] = await pool.query(
    `INSERT INTO events (title, slug, description, event_type_id, banner_image, status, start_datetime, end_datetime, venue_id,
     capacity, registration_limit, waitlist_enabled, registration_required, registration_open, manual_approval, certificate_enabled,
     fee, prerequisites, learning_outcomes)
     VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [`Copy of ${event.title}`, slug, event.description, event.event_type_id, event.banner_image, event.start_datetime, event.end_datetime,
      event.venue_id, event.capacity, event.registration_limit, event.waitlist_enabled, event.registration_required, event.registration_open,
      event.manual_approval, event.certificate_enabled, event.fee, event.prerequisites, event.learning_outcomes]
  );
  await log(req, 'duplicated_event', 'events', result.insertId, { sourceEventId: req.params.id });
  req.params.id = result.insertId;
  return getEvent(req, res);
});

const listEventTypes = asyncHandler(async (_req, res) => {
  const [types] = await pool.query('SELECT * FROM event_types ORDER BY name ASC');
  res.json({ types });
});

const saveEventType = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Event type name is required' });
  const slug = req.body.slug?.trim() || slugify(name);
  if (req.params.id) await pool.query('UPDATE event_types SET name = ?, slug = ?, description = ?, is_active = ? WHERE id = ?', [name, slug, clean(req.body.description), req.body.isActive === undefined ? true : bool(req.body.isActive), req.params.id]);
  else await pool.query('INSERT INTO event_types (name, slug, description, is_active) VALUES (?, ?, ?, ?)', [name, slug, clean(req.body.description), req.body.isActive === undefined ? true : bool(req.body.isActive)]);
  await log(req, req.params.id ? 'updated_event_type' : 'created_event_type', 'event_types', req.params.id || slug);
  return listEventTypes(req, res);
});

const listVenues = asyncHandler(async (_req, res) => {
  const [venues] = await pool.query('SELECT * FROM venues ORDER BY name ASC');
  res.json({ venues });
});

const saveVenue = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: 'Venue name is required' });
  const values = [
    req.body.name.trim(),
    clean(req.body.location || req.body.address),
    clean(req.body.address),
    clean(req.body.city),
    clean(req.body.state),
    clean(req.body.country),
    clean(req.body.googleMapsLink || req.body.google_maps_link),
    clean(req.body.gpsCoordinates || req.body.gps_coordinates),
    clean(req.body.venueMapUrl || req.body.venue_map_url),
    clean(req.body.contactPerson || req.body.contact_person),
    clean(req.body.contactNumber || req.body.contact_number),
    num(req.body.capacity),
    clean(req.body.notes),
    clean(req.body.description),
    req.body.status || (req.body.isActive === false || req.body.isActive === 'false' ? 'inactive' : 'active'),
    req.body.isActive === undefined ? true : bool(req.body.isActive),
  ];
  if (req.params.id) {
    await pool.query(
      `UPDATE venues SET name = ?, location = ?, address = ?, city = ?, state = ?, country = ?, google_maps_link = ?,
       gps_coordinates = ?, venue_map_url = ?, contact_person = ?, contact_number = ?, capacity = ?, notes = ?,
       description = ?, status = ?, is_active = ? WHERE id = ?`,
      [...values, req.params.id]
    );
  } else {
    await pool.query(
      `INSERT INTO venues (name, location, address, city, state, country, google_maps_link, gps_coordinates, venue_map_url,
       contact_person, contact_number, capacity, notes, description, status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );
  }
  await log(req, req.params.id ? 'updated_venue' : 'created_venue', 'venues', req.params.id || req.body.name);
  return listVenues(req, res);
});

const addRegistration = asyncHandler(async (req, res) => {
  const [[event]] = await pool.query('SELECT capacity, waitlist_enabled FROM events WHERE id = ? LIMIT 1', [req.params.id]);
  const [[count]] = await pool.query("SELECT COUNT(*) AS total FROM event_registrations WHERE event_id = ? AND attendance_status != 'waitlisted'", [req.params.id]);
  const waitlisted = event?.capacity && Number(count.total) >= Number(event.capacity) && event.waitlist_enabled;
  const status = waitlisted ? 'waitlisted' : (req.body.attendanceStatus || 'registered');
  const [result] = await pool.query(
    'INSERT INTO event_registrations (event_id, registration_id, attendance_status, approval_status, qr_code) VALUES (?, ?, ?, ?, ?)',
    [req.params.id, clean(req.body.registrationId), status, req.body.approvalStatus || 'approved', `EVENT-${req.params.id}-${req.body.registrationId || Date.now()}`]
  );
  await log(req, 'registered_event_attendee', 'event_registrations', result.insertId, { eventId: req.params.id, status });
  res.status(201).json({ id: result.insertId, attendanceStatus: status });
});

const checkIn = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    "UPDATE event_registrations SET attendance_status = 'checked_in', checked_in_at = COALESCE(checked_in_at, NOW()) WHERE id = ? AND attendance_status != 'checked_in'",
    [req.params.registrationId]
  );
  if (!result.affectedRows) return res.status(409).json({ message: 'Already checked in or registration not found' });
  await log(req, 'checked_in_event_attendee', 'event_registrations', req.params.registrationId);
  res.json({ success: true });
});

const savePayment = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO event_payments (event_id, registration_id, amount, payment_status, transaction_id) VALUES (?, ?, ?, ?, ?)',
    [req.body.eventId, clean(req.body.registrationId), num(req.body.amount), req.body.paymentStatus || 'pending', clean(req.body.transactionId)]
  );
  await log(req, 'updated_event_payment', 'event_payments', result.insertId, { status: req.body.paymentStatus || 'pending' });
  res.status(201).json({ id: result.insertId });
});

const saveResource = asyncHandler(async (req, res) => {
  const url = await uploadAsset(req.file) || clean(req.body.resourceUrl);
  const [result] = await pool.query(
    'INSERT INTO event_resources (event_id, resource_name, resource_type, resource_url) VALUES (?, ?, ?, ?)',
    [req.body.eventId, req.body.resourceName, req.body.resourceType || 'pdf', url]
  );
  await log(req, 'uploaded_event_resource', 'event_resources', result.insertId);
  res.status(201).json({ id: result.insertId });
});

const saveFeedback = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO event_feedback (event_id, registration_id, rating, nps_score, feedback, suggestions) VALUES (?, ?, ?, ?, ?, ?)',
    [req.body.eventId, clean(req.body.registrationId), num(req.body.rating), num(req.body.npsScore), clean(req.body.feedback), clean(req.body.suggestions)]
  );
  await log(req, 'submitted_event_feedback', 'event_feedback', result.insertId);
  res.status(201).json({ id: result.insertId });
});

const generateCertificate = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO event_certificates (event_id, registration_id, certificate_type, certificate_url) VALUES (?, ?, ?, ?)',
    [req.body.eventId, clean(req.body.registrationId), req.body.certificateType || 'participation', clean(req.body.certificateUrl)]
  );
  await pool.query('UPDATE event_registrations SET certificate_generated = TRUE WHERE event_id = ? AND registration_id = ?', [req.body.eventId, clean(req.body.registrationId)]);
  await log(req, 'generated_event_certificate', 'event_certificates', result.insertId);
  res.status(201).json({ id: result.insertId });
});

const listRecords = (table, order = 'id DESC') => asyncHandler(async (_req, res) => {
  const [items] = await pool.query(`SELECT * FROM ${table} ORDER BY ${order}`);
  res.json({ items });
});

const reports = asyncHandler(async (_req, res) => {
  const [[registrations], [revenue], [attendance], [certificates], [feedback], [popular]] = await Promise.all([
    pool.query('SELECT events.title, COUNT(event_registrations.id) AS total FROM events LEFT JOIN event_registrations ON event_registrations.event_id = events.id GROUP BY events.id ORDER BY total DESC'),
    pool.query('SELECT events.title, SUM(event_payments.amount) AS total FROM events LEFT JOIN event_payments ON event_payments.event_id = events.id AND event_payments.payment_status = "paid" GROUP BY events.id ORDER BY total DESC'),
    pool.query('SELECT events.title, SUM(event_registrations.attendance_status = "checked_in") AS checkedIn, COUNT(event_registrations.id) AS registered FROM events LEFT JOIN event_registrations ON event_registrations.event_id = events.id GROUP BY events.id'),
    pool.query('SELECT events.title, COUNT(event_certificates.id) AS total FROM events LEFT JOIN event_certificates ON event_certificates.event_id = events.id GROUP BY events.id ORDER BY total DESC'),
    pool.query('SELECT events.title, AVG(event_feedback.rating) AS rating FROM events LEFT JOIN event_feedback ON event_feedback.event_id = events.id GROUP BY events.id ORDER BY rating DESC'),
    pool.query(`${eventSelect} GROUP BY events.id ORDER BY registered_count DESC LIMIT 10`),
  ]);
  res.json({ registrations, revenue, attendance, certificates, feedback, popular: popular.map(normalizeEvent) });
});

const publicSync = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`${eventSelect} WHERE events.status = 'published' ORDER BY events.start_datetime ASC`);
  res.json({ events: rows.map(normalizeEvent) });
});

module.exports = {
  addRegistration,
  checkIn,
  dashboard,
  deleteEvent,
  duplicateEvent,
  generateCertificate,
  getEvent,
  listEventTypes,
  listEvents,
  listRecords,
  listVenues,
  publicSync,
  reports,
  saveEvent,
  saveEventType,
  saveFeedback,
  savePayment,
  saveResource,
  saveVenue,
  setEventStatus,
};
