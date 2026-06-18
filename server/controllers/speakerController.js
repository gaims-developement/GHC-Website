const Speaker = require('../models/speakerModel');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const asyncHandler = require('../utils/asyncHandler');
const { applyEventScope, getCurrentEventId } = require('../utils/eventScope');

const validStatuses = ['draft', 'confirmed', 'cancelled', 'published'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const sanitizePayload = (body, file) => ({
  name: body.name?.trim(),
  fullName: (body.fullName || body.full_name || body.name)?.trim(),
  designation: body.designation?.trim(),
  institution: body.institution?.trim(),
  organization: (body.organization || body.institution)?.trim(),
  specialization: body.specialization?.trim(),
  country: body.country?.trim(),
  city: body.city?.trim(),
  bio: body.bio?.trim(),
  topic: body.topic?.trim(),
  achievements: body.achievements?.trim(),
  travelStatus: body.travelStatus || body.travel_status,
  accommodationStatus: body.accommodationStatus || body.accommodation_status,
  specialRequirements: body.specialRequirements || body.special_requirements,
  email: body.email?.trim(),
  phone: body.phone?.trim(),
  photoUrl: file ? `/uploads/speakers/${file.filename}` : body.photoUrl || body.photo_url,
  linkedinUrl: body.linkedinUrl || body.linkedin_url,
  twitterUrl: body.twitterUrl || body.twitter_url,
  websiteUrl: body.websiteUrl || body.website_url,
  instagramUrl: body.instagramUrl || body.instagram_url,
  featured: toBoolean(body.featured),
  keynote: toBoolean(body.keynote),
  displayOrder: body.displayOrder ?? body.display_order ?? 0,
  status: body.status || 'draft',
});

const validate = (payload) => {
  if (!payload.name && !payload.fullName) return 'Name is required';
  if (!validStatuses.includes(payload.status)) return 'Invalid status';
  return null;
};

const listSpeakers = asyncHandler(async (req, res) => {
  const includeDrafts = req.query.admin === '1' && ['SUPER_ADMIN', 'ADMIN', 'MEDIA'].includes(req.user?.role);
  const speakers = await Speaker.list({ includeDrafts, req });
  res.json({ speakers });
});

const getSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.findById(req.params.id, req);
  if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
  return res.json({ speaker });
});

const createSpeaker = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const speaker = await Speaker.create(payload, req);
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'created_speaker', module: 'speakers', recordId: String(speaker.id) });
  return res.status(201).json({ speaker });
});

const updateSpeaker = asyncHandler(async (req, res) => {
  const existing = await Speaker.findById(req.params.id, req);
  if (!existing) return res.status(404).json({ message: 'Speaker not found' });

  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const speaker = await Speaker.update(req.params.id, payload, req);
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'updated_speaker', module: 'speakers', recordId: String(req.params.id) });
  return res.json({ speaker });
});

const deleteSpeaker = asyncHandler(async (req, res) => {
  const deleted = await Speaker.remove(req.params.id, req);
  if (!deleted) return res.status(404).json({ message: 'Speaker not found' });
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'deleted_speaker', module: 'speakers', recordId: String(req.params.id) });
  return res.json({ success: true });
});

const archiveSpeaker = asyncHandler(async (req, res) => {
  const clauses = ['id = ?'];
  const params = [req.params.id];
  applyEventScope(clauses, params, req, 'event_id');
  await pool.query(`UPDATE speakers SET status = 'cancelled' WHERE ${clauses.join(' AND ')}`, params);
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'archived_speaker', module: 'speakers', recordId: String(req.params.id) });
  res.json({ speaker: await Speaker.findById(req.params.id, req) });
});

const publishSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.publish(req.params.id, req);
  if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'published_speaker', module: 'speakers', recordId: String(req.params.id) });
  return res.json({ speaker });
});

const reorderSpeakers = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.items)) {
    return res.status(400).json({ message: 'items array is required' });
  }

  await Speaker.reorder(req.body.items, req);
  return res.json({ success: true });
});

const speakerStats = asyncHandler(async (req, res) => {
  const stats = await Speaker.stats(req);
  const sessionClauses = [];
  const sessionParams = [];
  applyEventScope(sessionClauses, sessionParams, req, 'event_id');
  const sessionWhere = sessionClauses.length ? `WHERE ${sessionClauses.join(' AND ')}` : '';
  const upcomingClauses = ['s.start_time >= NOW()'];
  const upcomingParams = [];
  applyEventScope(upcomingClauses, upcomingParams, req, 's.event_id');
  const [[sessions]] = await pool.query(`SELECT COUNT(*) AS total, SUM(cme_credit_points) AS cmeCredits FROM sessions ${sessionWhere}`, sessionParams);
  const [upcoming] = await pool.query(`SELECT s.*, sp.full_name AS speaker_name, h.name AS hall_name, t.name AS track_name FROM sessions s LEFT JOIN speakers sp ON sp.id = s.speaker_id LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN tracks t ON t.id = s.track_id WHERE ${upcomingClauses.join(' AND ')} ORDER BY s.start_time ASC LIMIT 8`, upcomingParams);
  const [activity] = await pool.query(`SELECT * FROM activity_logs WHERE module IN ('speakers','sessions','schedule','cme') ORDER BY timestamp DESC LIMIT 8`);
  return res.json({
    stats: {
      total: Number(stats.total || 0),
      featured: Number(stats.featured || 0),
      keynotes: Number(stats.keynotes || 0),
      drafts: Number(stats.drafts || 0),
      confirmed: Number(stats.confirmed || 0),
      pendingApproval: Number(stats.pendingApproval || 0),
      sessionsScheduled: Number(sessions.total || 0),
      totalCmeCredits: Number(sessions.cmeCredits || 0),
    },
    upcomingSessions: upcoming,
    recentUpdates: activity,
  });
});

const listSimple = (table) => asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY name ASC`);
  res.json({ [table]: rows });
});

const saveTrack = asyncHandler(async (req, res) => {
  const payload = [req.body.name, req.body.description || null, req.body.color || '#4fc3f7'];
  let id = req.params.id;
  if (id) await pool.query('UPDATE tracks SET name = ?, description = ?, color = ? WHERE id = ?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO tracks (name, description, color) VALUES (?, ?, ?)', payload);
    id = result.insertId;
  }
  await ActivityLog.logActivity({ userId: req.user?.id, action: req.params.id ? 'updated_track' : 'created_track', module: 'tracks', recordId: String(id) });
  res.json({ id });
});

const saveHall = asyncHandler(async (req, res) => {
  const payload = [
    req.body.venueId || req.body.venue_id || null,
    req.body.name,
    Number(req.body.capacity || 0),
    req.body.location || null,
    req.body.floor || null,
    req.body.hallType || req.body.hall_type || 'meeting_room',
    req.body.status || 'available',
  ];
  let id = req.params.id;
  if (id) await pool.query('UPDATE halls SET venue_id = ?, name = ?, capacity = ?, location = ?, floor = ?, hall_type = ?, status = ? WHERE id = ?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO halls (venue_id, name, capacity, location, floor, hall_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  await ActivityLog.logActivity({ userId: req.user?.id, action: req.params.id ? 'updated_hall' : 'created_hall', module: 'halls', recordId: String(id) });
  res.json({ id });
});

const listSessions = asyncHandler(async (req, res) => {
  const clauses = [];
  const params = [];
  applyEventScope(clauses, params, req, 's.event_id');
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [sessions] = await pool.query(`SELECT s.*, sp.full_name AS speaker_name, h.name AS hall_name, t.name AS track_name, t.color AS track_color FROM sessions s LEFT JOIN speakers sp ON sp.id = s.speaker_id LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN tracks t ON t.id = s.track_id ${where} ORDER BY s.start_time ASC, s.created_at DESC`, params);
  res.json({ sessions });
});

const conflictsForSession = async ({ id = 0, speakerId, hallId, startTime, endTime, req = null }) => {
  if (!startTime || !endTime) return [];
  const clauses = ['id <> ?', "status <> 'cancelled'", '(? < end_time AND ? > start_time)', '((speaker_id IS NOT NULL AND speaker_id = ?) OR (hall_id IS NOT NULL AND hall_id = ?))'];
  const params = [id, startTime, endTime, speakerId || null, hallId || null];
  applyEventScope(clauses, params, req, 'event_id');
  const [rows] = await pool.query(
    `SELECT id, title,
      CASE WHEN speaker_id = ? THEN 'double_booked_speaker' WHEN hall_id = ? THEN 'double_booked_hall' ELSE 'overlap' END AS conflict
     FROM sessions
     WHERE ${clauses.join(' AND ')}`,
    [speakerId || null, hallId || null, ...params]
  );
  return rows;
};

const saveSession = asyncHandler(async (req, res) => {
  const eventId = getCurrentEventId(req);
  const payload = [
    req.body.title,
    req.body.description || null,
    req.body.speakerId || req.body.speaker_id || null,
    req.body.sessionType || req.body.session_type || 'lecture',
    req.body.hallId || req.body.hall_id || null,
    req.body.trackId || req.body.track_id || null,
    req.body.startTime || req.body.start_time || null,
    req.body.endTime || req.body.end_time || null,
    Number(req.body.cmeCreditPoints || req.body.cme_credit_points || 0),
    req.body.status || 'draft',
  ];
  let id = req.params.id;
  if (id) {
    const clauses = ['id = ?'];
    const params = [...payload, id];
    applyEventScope(clauses, params, req, 'event_id');
    await pool.query(`UPDATE sessions SET title=?, description=?, speaker_id=?, session_type=?, hall_id=?, track_id=?, start_time=?, end_time=?, cme_credit_points=?, status=? WHERE ${clauses.join(' AND ')}`, params);
  }
  else {
    const [result] = await pool.query('INSERT INTO sessions (title, description, speaker_id, session_type, hall_id, track_id, start_time, end_time, cme_credit_points, status, event_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [...payload, eventId]);
    id = result.insertId;
  }
  await ActivityLog.logActivity({ userId: req.user?.id, action: req.params.id ? 'updated_session' : 'created_session', module: 'sessions', recordId: String(id) });
  res.json({ id, conflicts: await conflictsForSession({ id, speakerId: payload[2], hallId: payload[4], startTime: payload[6], endTime: payload[7], req }) });
});

const deleteByTable = (table, moduleName) => asyncHandler(async (req, res) => {
  const clauses = ['id = ?'];
  const params = [req.params.id];
  if (table === 'sessions') applyEventScope(clauses, params, req, 'event_id');
  await pool.query(`DELETE FROM ${table} WHERE ${clauses.join(' AND ')}`, params);
  await ActivityLog.logActivity({ userId: req.user?.id, action: `deleted_${moduleName}`, module: moduleName, recordId: String(req.params.id) });
  res.status(204).send();
});

const saveResource = asyncHandler(async (req, res) => {
  const fileUrl = req.file ? `/uploads/speakers/${req.file.filename}` : req.body.fileUrl || req.body.file_url;
  const [result] = await pool.query('INSERT INTO session_resources (session_id, resource_name, resource_type, file_url) VALUES (?, ?, ?, ?)', [req.body.sessionId || req.body.session_id, req.body.resourceName || req.body.resource_name, req.body.resourceType || req.body.resource_type, fileUrl]);
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'uploaded_resource', module: 'resources', recordId: String(result.insertId) });
  res.status(201).json({ id: result.insertId, fileUrl });
});

const listResources = asyncHandler(async (_req, res) => {
  const [resources] = await pool.query('SELECT sr.*, s.title AS session_title FROM session_resources sr LEFT JOIN sessions s ON s.id = sr.session_id ORDER BY sr.id DESC');
  const [documents] = await pool.query('SELECT sd.*, sp.full_name AS speaker_name FROM speaker_documents sd LEFT JOIN speakers sp ON sp.id = sd.speaker_id ORDER BY sd.id DESC');
  res.json({ resources, documents });
});

const saveCme = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    `INSERT INTO cme_records (session_id, credit_hours, credit_points, approved, approved_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE credit_hours = VALUES(credit_hours), credit_points = VALUES(credit_points), approved = VALUES(approved), approved_by = VALUES(approved_by)`,
    [req.body.sessionId || req.body.session_id, Number(req.body.creditHours || 0), Number(req.body.creditPoints || 0), toBoolean(req.body.approved), toBoolean(req.body.approved) ? req.user?.id : null]
  );
  await ActivityLog.logActivity({ userId: req.user?.id, action: 'updated_cme_record', module: 'cme', recordId: String(result.insertId || req.body.sessionId) });
  res.json({ id: result.insertId || req.body.sessionId });
});

const listCme = asyncHandler(async (_req, res) => {
  const [records] = await pool.query('SELECT c.*, s.title AS session_title, u.name AS approved_by_name FROM cme_records c LEFT JOIN sessions s ON s.id = c.session_id LEFT JOIN users u ON u.id = c.approved_by ORDER BY c.id DESC');
  res.json({ records });
});

const speakerAnalytics = asyncHandler(async (req, res) => {
  const series = async (sql, params = []) => {
    const [rows] = await pool.query(sql, params);
    return rows.map((row) => ({ label: row.label || 'Unknown', value: Number(row.value || 0) }));
  };
  const sClauses = [];
  const sParams = [];
  applyEventScope(sClauses, sParams, req, 's.event_id');
  const sWhere = sClauses.length ? `WHERE ${sClauses.join(' AND ')}` : '';
  const spClauses = [];
  const spParams = [];
  applyEventScope(spClauses, spParams, req, 'event_id');
  const spWhere = spClauses.length ? `WHERE ${spClauses.join(' AND ')}` : '';
  const upcomingClauses = ['start_time >= NOW()'];
  const upcomingParams = [];
  applyEventScope(upcomingClauses, upcomingParams, req, 'event_id');
  res.json({
    charts: {
      sessionsPerTrack: await series(`SELECT COALESCE(t.name, 'Unassigned') AS label, COUNT(*) AS value FROM sessions s LEFT JOIN tracks t ON t.id = s.track_id ${sWhere} GROUP BY label`, sParams),
      speakersByCountry: await series(`SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS value FROM speakers ${spWhere} GROUP BY label`, spParams),
      sessionsPerHall: await series(`SELECT COALESCE(h.name, 'Unassigned') AS label, COUNT(*) AS value FROM sessions s LEFT JOIN halls h ON h.id = s.hall_id ${sWhere} GROUP BY label`, sParams),
      upcomingSessions: await series(`SELECT DATE(start_time) AS label, COUNT(*) AS value FROM sessions WHERE ${upcomingClauses.join(' AND ')} GROUP BY DATE(start_time)`, upcomingParams),
      mostPopularTracks: await series(`SELECT COALESCE(t.name, 'Unassigned') AS label, COUNT(*) AS value FROM sessions s LEFT JOIN tracks t ON t.id = s.track_id ${sWhere} GROUP BY label ORDER BY value DESC`, sParams),
    },
  });
});

module.exports = {
  createSpeaker,
  archiveSpeaker,
  deleteSpeaker,
  deleteHall: deleteByTable('halls', 'halls'),
  deleteSession: deleteByTable('sessions', 'sessions'),
  deleteTrack: deleteByTable('tracks', 'tracks'),
  getSpeaker,
  listCme,
  listHalls: listSimple('halls'),
  listResources,
  listSessions,
  listSpeakers,
  listTracks: listSimple('tracks'),
  publishSpeaker,
  reorderSpeakers,
  saveCme,
  saveHall,
  saveResource,
  saveSession,
  saveTrack,
  speakerAnalytics,
  speakerStats,
  updateSpeaker,
};
