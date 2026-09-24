const { pool } = require('../config/db');

const fallbackImages = [
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&q=80',
  'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500&q=80',
  'https://images.unsplash.com/photo-1558403194-611308249627?w=500&q=80',
];

const formatTimeRange = (startTime, endTime) => {
  if (!startTime) return 'Time to be announced';
  try {
    const start = new Date(startTime);
    if (isNaN(start.getTime())) return 'Time to be announced';
    const startStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (!endTime) return startStr;
    const end = new Date(endTime);
    if (isNaN(end.getTime())) return startStr;
    const endStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startStr} - ${endStr}`;
  } catch {
    return 'Time to be announced';
  }
};

const getDayAndDate = (startTime) => {
  if (!startTime) {
    return { day: 'Day 1', date: 'November 22, 2026' };
  }
  try {
    const d = new Date(startTime);
    if (isNaN(d.getTime())) {
      return { day: 'Day 1', date: 'November 22, 2026' };
    }
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getUTCDate()).padStart(2, '0');
    const ymd = `${year}-${month}-${dayNum}`;

    const localYear = d.getFullYear();
    const localMonth = String(d.getMonth() + 1).padStart(2, '0');
    const localDayNum = String(d.getDate()).padStart(2, '0');
    const localYmd = `${localYear}-${localMonth}-${localDayNum}`;

    if (ymd === '2026-11-22' || localYmd === '2026-11-22') {
      return { day: 'Day 1', date: 'November 22, 2026' };
    }
    if (ymd === '2026-11-23' || localYmd === '2026-11-23') {
      return { day: 'Day 2', date: 'November 23, 2026' };
    }
    if (ymd === '2026-11-24' || localYmd === '2026-11-24') {
      return { day: 'Day 3', date: 'November 24, 2026' };
    }

    const formattedDate = d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return { day: 'Day 1', date: formattedDate };
  } catch {
    return { day: 'Day 1', date: 'November 22, 2026' };
  }
};

const normalizeSession = (session, index = 0) => {
  if (!session) return null;
  const { day, date } = getDayAndDate(session.start_time);
  const time = formatTimeRange(session.start_time, session.end_time);

  const speakerName = session.speaker_name || '';
  const description = session.description || (speakerName ? `Session presentation by ${speakerName}` : 'Conference scientific session and discussions');

  let imageUrl = session.speaker_image || '';
  if (!imageUrl) {
    imageUrl = fallbackImages[index % fallbackImages.length];
  }

  return {
    _id: String(session.id),
    id: session.id,
    title: session.title || 'Untitled Session',
    description,
    day,
    date,
    time,
    startTime: session.start_time,
    endTime: session.end_time,
    imageUrl,
    image_url: imageUrl,
    speaker: speakerName,
    speakerDesignation: session.speaker_designation || '',
    speakerOrganization: session.speaker_organization || '',
    hall: session.hall_name || '',
    hallLocation: session.hall_location || '',
    location: session.hall_location || session.hall_name || '',
    track: session.track_name || '',
    cmePoints: session.cme_credit_points ? Number(session.cme_credit_points) : 0,
    cme_credit_points: session.cme_credit_points ? Number(session.cme_credit_points) : 0,
    cme: session.cme_credit_points ? Number(session.cme_credit_points) : 0,
    sessionType: session.session_type || 'Lecture',
    status: session.status || 'draft',
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
};

const list = async () => {
  const [sessions] = await pool.query(
    `SELECT 
       s.id,
       s.title,
       s.description,
       s.session_type,
       s.hall_id,
       s.track_id,
       s.speaker_id,
       s.start_time,
       s.end_time,
       s.cme_credit_points,
       s.status,
       s.created_at,
       s.updated_at,
       COALESCE(sp.full_name, sp.name) AS speaker_name,
       COALESCE(sp.profile_image, sp.photo_url) AS speaker_image,
       sp.designation AS speaker_designation,
       sp.organization AS speaker_organization,
       h.name AS hall_name,
       h.location AS hall_location,
       t.name AS track_name,
       t.color AS track_color
     FROM sessions s
     LEFT JOIN speakers sp ON sp.id = s.speaker_id
     LEFT JOIN halls h ON h.id = s.hall_id
     LEFT JOIN tracks t ON t.id = s.track_id
     WHERE s.status != 'cancelled' OR s.status IS NULL
     ORDER BY s.start_time ASC, s.created_at DESC`
  );

  if (sessions && sessions.length > 0) {
    return sessions.map((s, idx) => normalizeSession(s, idx));
  }

  // Fallback to legacy schedules table if sessions table is empty
  const [legacy] = await pool.query('SELECT * FROM schedules ORDER BY day ASC, time ASC');
  return legacy.map((row, idx) => ({
    _id: String(row.id),
    id: row.id,
    day: row.day || 'Day 1',
    date: row.date || 'November 22, 2026',
    time: row.time || 'Time to be announced',
    title: row.title || 'Untitled Session',
    description: row.description || '',
    imageUrl: row.image_url || fallbackImages[idx % fallbackImages.length],
    image_url: row.image_url || fallbackImages[idx % fallbackImages.length],
    location: row.location || '',
    speaker: row.speaker || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT 
       s.id,
       s.title,
       s.description,
       s.session_type,
       s.hall_id,
       s.track_id,
       s.speaker_id,
       s.start_time,
       s.end_time,
       s.cme_credit_points,
       s.status,
       s.created_at,
       s.updated_at,
       COALESCE(sp.full_name, sp.name) AS speaker_name,
       COALESCE(sp.profile_image, sp.photo_url) AS speaker_image,
       sp.designation AS speaker_designation,
       sp.organization AS speaker_organization,
       h.name AS hall_name,
       h.location AS hall_location,
       t.name AS track_name,
       t.color AS track_color
     FROM sessions s
     LEFT JOIN speakers sp ON sp.id = s.speaker_id
     LEFT JOIN halls h ON h.id = s.hall_id
     LEFT JOIN tracks t ON t.id = s.track_id
     WHERE s.id = ? LIMIT 1`,
    [id]
  );
  if (rows && rows[0]) {
    return normalizeSession(rows[0]);
  }
  const [legacy] = await pool.query('SELECT * FROM schedules WHERE id = ? LIMIT 1', [id]);
  return legacy[0] ? normalizeSession(legacy[0]) : null;
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO sessions (title, description, speaker_id, session_type, hall_id, track_id, start_time, end_time, cme_credit_points, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title || null,
      data.description || null,
      data.speakerId || data.speaker_id || null,
      data.sessionType || data.session_type || 'lecture',
      data.hallId || data.hall_id || null,
      data.trackId || data.track_id || null,
      data.startTime || data.start_time || null,
      data.endTime || data.end_time || null,
      data.cmeCreditPoints || data.cme_credit_points || 0,
      data.status || 'draft',
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE sessions SET
       title = COALESCE(?, title),
       description = COALESCE(?, description),
       speaker_id = COALESCE(?, speaker_id),
       session_type = COALESCE(?, session_type),
       hall_id = COALESCE(?, hall_id),
       track_id = COALESCE(?, track_id),
       start_time = COALESCE(?, start_time),
       end_time = COALESCE(?, end_time),
       cme_credit_points = COALESCE(?, cme_credit_points),
       status = COALESCE(?, status)
     WHERE id = ?`,
    [
      data.title,
      data.description,
      data.speakerId || data.speaker_id,
      data.sessionType || data.session_type,
      data.hallId || data.hall_id,
      data.trackId || data.track_id,
      data.startTime || data.start_time,
      data.endTime || data.end_time,
      data.cmeCreditPoints || data.cme_credit_points,
      data.status,
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM sessions WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { create, findById, list, remove, update };