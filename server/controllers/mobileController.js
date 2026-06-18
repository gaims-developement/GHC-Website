const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const signMobileToken = (mobileUser) => jwt.sign(
  { mobileUserId: mobileUser.id, registrationId: mobileUser.registration_id, type: 'mobile' },
  process.env.JWT_SECRET || 'change-this-secret',
  { expiresIn: process.env.MOBILE_JWT_EXPIRES_IN || '30d' }
);

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const hashToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const getMobileAuth = async (req) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    if (payload.type !== 'mobile') return null;
    const [[user]] = await pool.query('SELECT * FROM mobile_users WHERE id = ?', [payload.mobileUserId]);
    return user || null;
  } catch {
    return null;
  }
};

const requireMobileUser = async (req, res) => {
  const mobileUser = await getMobileAuth(req);
  if (!mobileUser) {
    res.status(401).json({ message: 'Mobile authentication required' });
    return null;
  }
  req.mobileUser = mobileUser;
  await pool.query('UPDATE mobile_users SET last_active = NOW() WHERE id = ?', [mobileUser.id]);
  return mobileUser;
};

const logAppActivity = (userId, activityType, recordType = null, recordId = null, metadata = null) =>
  pool.query(
    'INSERT INTO app_activity_logs (user_id, activity_type, record_type, record_id, metadata) VALUES (?, ?, ?, ?, ?)',
    [userId || null, activityType, recordType, recordId, metadata ? JSON.stringify(metadata) : null]
  ).catch(() => {});

const login = asyncHandler(async (req, res) => {
  const code = req.body.registrationId || req.body.registration_id;
  const email = req.body.email;
  if (!code || !email) return res.status(400).json({ message: 'Registration ID and email are required' });

  const [[registration]] = await pool.query(
    'SELECT * FROM registrations WHERE (id = ? OR registration_id = ?) AND email = ? LIMIT 1',
    [code, code, email]
  );
  if (!registration) return res.status(401).json({ message: 'Registration not found' });

  await pool.query(
    `INSERT INTO mobile_users (registration_id, institution, last_active)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE institution = COALESCE(VALUES(institution), institution), last_active = NOW()`,
    [registration.id, registration.institution || null]
  );
  const [[mobileUser]] = await pool.query('SELECT * FROM mobile_users WHERE registration_id = ?', [registration.id]);
  const token = signMobileToken(mobileUser);
  res.json({ token, user: { ...mobileUser, registration } });
});

const profile = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  if (req.method === 'GET') {
    const [[registration]] = await pool.query('SELECT id, registration_id, full_name, email, phone, institution, designation, qr_code, attendance_status FROM registrations WHERE id = ?', [user.registration_id]);
    return res.json({ user: { ...user, interests: parseJson(user.interests, []), visibility_settings: parseJson(user.visibility_settings, {}), registration } });
  }
  await pool.query(
    'UPDATE mobile_users SET profile_photo=?, bio=?, specialization=?, institution=?, linkedin=?, interests=?, visibility_settings=? WHERE id=?',
    [
      req.body.profilePhoto || req.body.profile_photo || user.profile_photo,
      req.body.bio || null,
      req.body.specialization || null,
      req.body.institution || null,
      req.body.linkedin || null,
      JSON.stringify(req.body.interests || []),
      JSON.stringify(req.body.visibilitySettings || req.body.visibility_settings || {}),
      user.id,
    ]
  );
  res.json({ success: true });
});

const bootstrap = asyncHandler(async (req, res) => {
  const user = await getMobileAuth(req);
  const [[settings]] = await pool.query('SELECT setting_value FROM mobile_app_settings WHERE setting_key = "app_config" LIMIT 1');
  const [[announcements]] = await pool.query("SELECT COUNT(*) AS count FROM announcements WHERE status = 'published'");
  const [[sessions]] = await pool.query("SELECT COUNT(*) AS count FROM sessions WHERE status IN ('published','confirmed')");
  const [[workshops]] = await pool.query("SELECT COUNT(*) AS count FROM workshops WHERE status = 'published'");
  res.json({
    authenticated: Boolean(user),
    config: parseJson(settings?.setting_value, { offlineCache: ['agenda', 'speakers', 'venue', 'resources', 'certificates'], qrCheckin: true, push: true }),
    counts: { announcements: announcements.count, sessions: sessions.count, workshops: workshops.count },
  });
});

const schedule = asyncHandler(async (req, res) => {
  const user = await getMobileAuth(req);
  const [rows] = await pool.query(`
    SELECT s.*, sp.full_name AS speaker_name, sp.photo_url AS speaker_photo, h.name AS hall_name, h.location AS hall_location, t.name AS track_name, t.color AS track_color,
      ${user ? 'saved_sessions.id IS NOT NULL' : 'FALSE'} AS saved
    FROM sessions s
    LEFT JOIN speakers sp ON sp.id = s.speaker_id
    LEFT JOIN halls h ON h.id = s.hall_id
    LEFT JOIN tracks t ON t.id = s.track_id
    ${user ? 'LEFT JOIN saved_sessions ON saved_sessions.session_id = s.id AND saved_sessions.user_id = ?' : ''}
    WHERE s.status IN ('published','confirmed')
    ORDER BY s.start_time ASC`,
    user ? [user.id] : []
  );
  res.json({ sessions: rows });
});

const speakers = asyncHandler(async (req, res) => {
  const user = await getMobileAuth(req);
  const [rows] = await pool.query(`
    SELECT speakers.id, speakers.full_name, speakers.name, speakers.designation, speakers.institution, speakers.specialization,
      speakers.country, speakers.city, speakers.bio, speakers.photo_url, speakers.linkedin_url, speakers.twitter_url, speakers.website_url,
      ${user ? 'saved_speakers.id IS NOT NULL' : 'FALSE'} AS saved
    FROM speakers
    ${user ? 'LEFT JOIN saved_speakers ON saved_speakers.speaker_id = speakers.id AND saved_speakers.user_id = ?' : ''}
    WHERE speakers.status IN ('published','confirmed')
    ORDER BY speakers.display_order ASC, speakers.full_name ASC`,
    user ? [user.id] : []
  );
  res.json({ speakers: rows });
});

const workshops = asyncHandler(async (req, res) => {
  const user = await getMobileAuth(req);
  const [rows] = await pool.query(`
    SELECT workshops.*, COUNT(workshop_registrations.id) AS app_registrations
    FROM workshops
    LEFT JOIN workshop_registrations ON workshop_registrations.workshop_id = workshops.id
    WHERE workshops.status = 'published'
    GROUP BY workshops.id
    ORDER BY workshops.date ASC, workshops.display_order ASC
  `);
  res.json({ workshops: rows, authenticated: Boolean(user) });
});

const registerWorkshop = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  const [[workshop]] = await pool.query('SELECT * FROM workshops WHERE id = ? LIMIT 1', [req.params.id]);
  if (!workshop) return res.status(404).json({ message: 'Workshop not found' });
  const [[count]] = await pool.query("SELECT COUNT(*) AS count FROM workshop_registrations WHERE workshop_id = ? AND status IN ('confirmed','registered')", [workshop.id]);
  const status = Number(count.count) >= Number(workshop.capacity || 0) ? 'waitlisted' : 'confirmed';
  await pool.query(
    'INSERT INTO workshop_registrations (workshop_id, registration_id, status) VALUES (?, ?, ?)',
    [workshop.id, user.registration_id, status]
  );
  if (status === 'confirmed') await pool.query('UPDATE workshops SET registered_count = registered_count + 1 WHERE id = ?', [workshop.id]);
  await logAppActivity(user.id, 'registered_workshop', 'workshop', workshop.id, { status });
  res.status(201).json({ status });
});

const saveSession = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  await pool.query('INSERT IGNORE INTO saved_sessions (user_id, session_id, reminder_enabled) VALUES (?, ?, ?)', [user.id, req.params.id, req.body.reminderEnabled !== false]);
  await logAppActivity(user.id, 'saved_session', 'session', req.params.id);
  res.json({ success: true });
});

const unsaveSession = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  await pool.query('DELETE FROM saved_sessions WHERE user_id = ? AND session_id = ?', [user.id, req.params.id]);
  res.json({ success: true });
});

const bookmarkSpeaker = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  await pool.query('INSERT IGNORE INTO saved_speakers (user_id, speaker_id) VALUES (?, ?)', [user.id, req.params.id]);
  await logAppActivity(user.id, 'bookmarked_speaker', 'speaker', req.params.id);
  res.json({ success: true });
});

const resources = asyncHandler(async (_req, res) => {
  const [[sessionResources], [speakerDocs], [eventResources], [certificates]] = await Promise.all([
    pool.query('SELECT sr.*, s.title AS session_title FROM session_resources sr LEFT JOIN sessions s ON s.id = sr.session_id ORDER BY sr.id DESC'),
    pool.query('SELECT sd.*, sp.full_name AS speaker_name FROM speaker_documents sd LEFT JOIN speakers sp ON sp.id = sd.speaker_id ORDER BY sd.id DESC'),
    pool.query('SELECT er.*, e.title AS event_title FROM event_resources er LEFT JOIN events e ON e.id = er.event_id ORDER BY er.id DESC'),
    pool.query("SELECT id, certificate_id, recipient_name, recipient_email, certificate_url, issue_date FROM certificates WHERE status = 'generated' ORDER BY issue_date DESC LIMIT 100"),
  ]);
  res.json({ sessionResources, speakerDocs, eventResources, certificates });
});

const announcements = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query("SELECT id, title, content, featured_image, publish_date, is_pinned FROM announcements WHERE status = 'published' AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY is_pinned DESC, publish_date DESC");
  res.json({ announcements: rows });
});

const sponsors = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM sponsors WHERE is_active = TRUE AND status IN ('confirmed','completed') ORDER BY company_name ASC");
  res.json({ sponsors: rows });
});

const certificates = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  const [[registration]] = await pool.query('SELECT email, full_name FROM registrations WHERE id = ?', [user.registration_id]);
  const [rows] = await pool.query('SELECT * FROM certificates WHERE registration_id = ? OR recipient_email = ? ORDER BY issue_date DESC, created_at DESC', [user.registration_id, registration?.email || '']);
  res.json({ certificates: rows });
});

const venue = asyncHandler(async (_req, res) => {
  const [[venues], [halls], [accommodation], [transport], [emergency]] = await Promise.all([
    pool.query('SELECT * FROM venues ORDER BY name ASC'),
    pool.query('SELECT * FROM halls ORDER BY name ASC'),
    pool.query('SELECT * FROM accommodations ORDER BY name ASC'),
    pool.query('SELECT * FROM transport_routes ORDER BY name ASC'),
    pool.query('SELECT * FROM emergency_contacts ORDER BY priority_level ASC, name ASC'),
  ]);
  res.json({ venues, halls, accommodation, transport, emergency });
});

const notifications = asyncHandler(async (req, res) => {
  const user = await getMobileAuth(req);
  const [rows] = await pool.query(`
    SELECT app_notifications.*,
      ${user ? 'push_notification_logs.opened_at IS NOT NULL' : 'FALSE'} AS opened
    FROM app_notifications
    ${user ? 'LEFT JOIN push_notification_logs ON push_notification_logs.notification_id = app_notifications.id AND push_notification_logs.user_id = ?' : ''}
    WHERE scheduled_at IS NULL OR scheduled_at <= NOW()
    ORDER BY created_at DESC
    LIMIT 100`,
    user ? [user.id] : []
  );
  res.json({ notifications: rows });
});

const saveDeviceToken = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  const token = req.body.deviceToken || req.body.device_token;
  if (!token) return res.status(400).json({ message: 'Device token is required' });
  await pool.query(
    `INSERT INTO device_tokens (user_id, platform, device_token, token_hash, last_seen)
     VALUES (?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), last_seen = NOW()`,
    [user.id, req.body.platform || 'web', token, hashToken(token)]
  );
  res.json({ success: true });
});

const mobileCheckin = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  const location = req.body.location || 'Mobile App';
  await pool.query(
    `INSERT INTO attendance_logs (registration_id, checkin_time, check_in_time, workshop_id, location)
     VALUES (?, NOW(), NOW(), ?, ?)`,
    [user.registration_id, req.body.workshopId || req.body.workshop_id || null, location]
  );
  await pool.query("UPDATE registrations SET attendance = TRUE, attendance_status = 'checked_in' WHERE id = ?", [user.registration_id]);
  await logAppActivity(user.id, 'checked_in', req.body.workshopId ? 'workshop' : 'venue', req.body.workshopId || null, { location });
  res.json({ success: true });
});

const activity = asyncHandler(async (req, res) => {
  const user = await requireMobileUser(req, res);
  if (!user) return;
  await logAppActivity(user.id, req.body.activityType || req.body.activity_type, req.body.recordType || null, req.body.recordId || null, req.body.metadata || null);
  res.json({ success: true });
});

const adminDashboard = asyncHandler(async (_req, res) => {
  const [[users], [daily], [push], [viewed], [saved]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM mobile_users'),
    pool.query('SELECT COUNT(DISTINCT user_id) AS total FROM app_activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)'),
    pool.query("SELECT COUNT(*) AS total FROM push_notification_logs WHERE status IN ('sent','opened')"),
    pool.query("SELECT s.title, COUNT(*) AS total FROM app_activity_logs l LEFT JOIN sessions s ON s.id = l.record_id WHERE l.activity_type = 'viewed_session' GROUP BY l.record_id, s.title ORDER BY total DESC LIMIT 6"),
    pool.query('SELECT s.title, COUNT(*) AS total FROM saved_sessions ss LEFT JOIN sessions s ON s.id = ss.session_id GROUP BY ss.session_id, s.title ORDER BY total DESC LIMIT 6'),
  ]);
  const engagementRate = Number(users[0]?.total || 0) ? Math.round((Number(daily[0]?.total || 0) / Number(users[0].total)) * 100) : 0;
  res.json({
    metrics: {
      totalMobileUsers: Number(users[0]?.total || 0),
      dailyActiveUsers: Number(daily[0]?.total || 0),
      pushNotificationsSent: Number(push[0]?.total || 0),
      engagementRate,
    },
    mostViewedSessions: viewed,
    mostSavedSessions: saved,
  });
});

const adminUsers = asyncHandler(async (_req, res) => {
  const [users] = await pool.query(`
    SELECT mu.*, r.registration_id AS registration_code, r.full_name, r.email, r.phone, r.attendance_status
    FROM mobile_users mu
    LEFT JOIN registrations r ON r.id = mu.registration_id
    ORDER BY mu.last_active DESC, mu.created_at DESC
    LIMIT 500
  `);
  res.json({ users });
});

const adminNotifications = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM app_notifications ORDER BY created_at DESC LIMIT 200');
    return res.json({ notifications: rows });
  }
  const [result] = await pool.query(
    'INSERT INTO app_notifications (title, message, type, target_audience, deep_link, scheduled_at, created_by, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.body.title, req.body.message, req.body.type || 'announcement', req.body.targetAudience || req.body.target_audience || 'all', req.body.deepLink || req.body.deep_link || null, req.body.scheduledAt || null, req.user?.id || null, req.body.sendNow ? new Date() : null]
  );
  if (req.body.sendNow) {
    const [tokens] = await pool.query('SELECT id, user_id FROM device_tokens');
    if (tokens.length) {
      await pool.query(
        'INSERT INTO push_notification_logs (notification_id, user_id, device_token_id, status, sent_at) VALUES ?',
        [tokens.map((token) => [result.insertId, token.user_id, token.id, 'sent', new Date()])]
      );
    }
  }
  res.status(201).json({ id: result.insertId });
});

const adminAnalytics = asyncHandler(async (_req, res) => {
  const series = async (sql) => {
    const [rows] = await pool.query(sql);
    return rows;
  };
  res.json({
    dailyActiveUsers: await series('SELECT DATE(created_at) AS label, COUNT(DISTINCT user_id) AS total FROM app_activity_logs GROUP BY label ORDER BY label DESC LIMIT 30'),
    sessionPopularity: await series("SELECT s.title AS label, COUNT(*) AS total FROM app_activity_logs l LEFT JOIN sessions s ON s.id = l.record_id WHERE l.activity_type IN ('viewed_session','saved_session') GROUP BY l.record_id, s.title ORDER BY total DESC LIMIT 20"),
    speakerPopularity: await series("SELECT sp.full_name AS label, COUNT(*) AS total FROM app_activity_logs l LEFT JOIN speakers sp ON sp.id = l.record_id WHERE l.activity_type IN ('viewed_speaker','bookmarked_speaker') GROUP BY l.record_id, sp.full_name ORDER BY total DESC LIMIT 20"),
    notificationOpenRate: await series("SELECT n.title AS label, SUM(l.status = 'opened') AS opened, COUNT(l.id) AS total FROM app_notifications n LEFT JOIN push_notification_logs l ON l.notification_id = n.id GROUP BY n.id ORDER BY n.created_at DESC LIMIT 20"),
    resourceDownloads: await series("SELECT record_type AS label, COUNT(*) AS total FROM app_activity_logs WHERE activity_type = 'downloaded_resource' GROUP BY record_type"),
  });
});

const appSettings = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM mobile_app_settings ORDER BY setting_key ASC');
    return res.json({ settings: rows.map((row) => ({ ...row, setting_value: parseJson(row.setting_value, {}) })) });
  }
  await pool.query(
    `INSERT INTO mobile_app_settings (setting_key, setting_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    [req.body.key || 'app_config', JSON.stringify(req.body.value || {}), req.user?.id || null]
  );
  res.json({ success: true });
});

module.exports = {
  activity,
  adminAnalytics,
  adminDashboard,
  adminNotifications,
  adminUsers,
  announcements,
  appSettings,
  bookmarkSpeaker,
  bootstrap,
  certificates,
  login,
  mobileCheckin,
  notifications,
  profile,
  registerWorkshop,
  resources,
  saveDeviceToken,
  saveSession,
  schedule,
  speakers,
  sponsors,
  unsaveSession,
  venue,
  workshops,
};
