const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const clean = (value) => (value === undefined || value === null || value === '' ? null : value);
const num = (value) => Number(value || 0);
const dateTime = (value) => clean(value) ? String(value).replace('T', ' ').slice(0, 19) : null;
const log = (req, action, module, recordId, metadata) =>
  ActivityLog.logActivity({ userId: req.user?.id, action, module, recordId: String(recordId || ''), metadata });

const uploadAsset = async (file) => {
  if (!file) return null;
  if (!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET)) return `/uploads/volunteers/${file.filename}`;
  const result = await uploadToCloudinary(file.path, 'gallery', { resourceType: 'auto' });
  return result.secure_url;
};

const configs = {
  volunteers: {
    table: 'volunteers',
    key: 'volunteers',
    fields: ['full_name', 'email', 'phone', 'gender', 'date_of_birth', 'institution', 'course', 'year_of_study', 'city', 'profile_photo', 'resume_url', 'id_card_url', 'emergency_contact_name', 'emergency_contact_phone', 'skills', 'availability', 'application_status', 'joined_at'],
    values: async (b, req) => {
      const photo = await uploadAsset(req.files?.profilePhoto?.[0]);
      const resume = await uploadAsset(req.files?.resume?.[0]);
      const idCard = await uploadAsset(req.files?.idCard?.[0]);
      return [
        b.fullName || b.full_name,
        clean(b.email),
        clean(b.phone),
        clean(b.gender),
        clean(b.dateOfBirth || b.date_of_birth),
        clean(b.institution),
        clean(b.course),
        clean(b.yearOfStudy || b.year_of_study),
        clean(b.city),
        photo || clean(b.profilePhoto || b.profile_photo),
        resume || clean(b.resumeUrl || b.resume_url),
        idCard || clean(b.idCardUrl || b.id_card_url),
        clean(b.emergencyContactName || b.emergency_contact_name),
        clean(b.emergencyContactPhone || b.emergency_contact_phone),
        clean(b.skills),
        clean(b.availability),
        b.applicationStatus || b.application_status || 'applied',
        dateTime(b.joinedAt || b.joined_at),
      ];
    },
  },
  departments: {
    table: 'volunteer_departments',
    key: 'departments',
    fields: ['name', 'description', 'is_active'],
    values: async (b) => [b.name, clean(b.description), b.isActive === undefined ? true : b.isActive === true || b.isActive === 'true'],
  },
  assignments: {
    table: 'volunteer_assignments',
    key: 'assignments',
    fields: ['volunteer_id', 'department_id', 'assigned_by', 'role'],
    values: async (b, req) => [b.volunteerId || b.volunteer_id, b.departmentId || b.department_id, req.user?.id || null, clean(b.role)],
  },
  shifts: {
    table: 'shifts',
    key: 'shifts',
    fields: ['title', 'department_id', 'date', 'start_time', 'end_time', 'location', 'capacity'],
    values: async (b) => [b.title, clean(b.departmentId || b.department_id), clean(b.date), clean(b.startTime || b.start_time), clean(b.endTime || b.end_time), clean(b.location), num(b.capacity)],
  },
  shiftAssignments: {
    table: 'shift_assignments',
    key: 'assignments',
    fields: ['shift_id', 'volunteer_id', 'attendance_status'],
    values: async (b) => [b.shiftId || b.shift_id, b.volunteerId || b.volunteer_id, b.attendanceStatus || b.attendance_status || 'assigned'],
  },
  attendance: {
    table: 'volunteer_attendance',
    key: 'attendance',
    fields: ['volunteer_id', 'check_in_time', 'check_out_time', 'location', 'recorded_by'],
    values: async (b, req) => [b.volunteerId || b.volunteer_id, dateTime(b.checkInTime || b.check_in_time) || new Date(), dateTime(b.checkOutTime || b.check_out_time), clean(b.location), req.user?.id || null],
  },
  reviews: {
    table: 'performance_reviews',
    key: 'reviews',
    fields: ['volunteer_id', 'reviewed_by', 'communication_score', 'leadership_score', 'discipline_score', 'teamwork_score', 'initiative_score', 'comments', 'overall_score'],
    values: async (b, req) => {
      const scores = [num(b.communicationScore || b.communication_score), num(b.leadershipScore || b.leadership_score), num(b.disciplineScore || b.discipline_score), num(b.teamworkScore || b.teamwork_score), num(b.initiativeScore || b.initiative_score)];
      return [b.volunteerId || b.volunteer_id, req.user?.id || null, ...scores, clean(b.comments), b.overallScore || b.overall_score || (scores.reduce((a, v) => a + v, 0) / scores.length)];
    },
  },
  certificates: {
    table: 'volunteer_certificates',
    key: 'certificates',
    fields: ['volunteer_id', 'certificate_type', 'certificate_url'],
    values: async (b) => [b.volunteerId || b.volunteer_id, b.certificateType || b.certificate_type || 'volunteer', clean(b.certificateUrl || b.certificate_url)],
  },
  announcements: {
    table: 'volunteer_announcements',
    key: 'announcements',
    fields: ['title', 'message', 'department_id', 'published_at', 'created_by'],
    values: async (b, req) => [b.title, clean(b.message), clean(b.departmentId || b.department_id), dateTime(b.publishedAt || b.published_at) || new Date(), req.user?.id || null],
  },
  interviews: {
    table: 'volunteer_interviews',
    key: 'interviews',
    fields: ['volunteer_id', 'interviewer_id', 'scheduled_at', 'feedback', 'score', 'status'],
    values: async (b, req) => [b.volunteerId || b.volunteer_id, clean(b.interviewerId || b.interviewer_id) || req.user?.id || null, dateTime(b.scheduledAt || b.scheduled_at), clean(b.feedback), num(b.score), b.status || 'scheduled'],
  },
  tasks: {
    table: 'volunteer_tasks',
    key: 'tasks',
    fields: ['title', 'description', 'volunteer_id', 'department_id', 'priority', 'status', 'due_date'],
    values: async (b) => [b.title, clean(b.description), clean(b.volunteerId || b.volunteer_id), clean(b.departmentId || b.department_id), b.priority || 'medium', b.status || 'todo', dateTime(b.dueDate || b.due_date)],
  },
};

const dashboard = asyncHandler(async (_req, res) => {
  const [[volunteers], [pending], [todayShifts], [attendance], [departments], [topPerformers], [activity]] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total, SUM(application_status IN ('selected', 'interviewed', 'shortlisted')) AS active FROM volunteers"),
    pool.query("SELECT COUNT(*) AS total FROM volunteers WHERE application_status = 'applied'"),
    pool.query('SELECT COUNT(*) AS total FROM shifts WHERE date = CURDATE()'),
    pool.query('SELECT SUM(check_in_time IS NOT NULL) AS present, COUNT(*) AS total FROM volunteer_attendance WHERE DATE(check_in_time) = CURDATE()'),
    pool.query('SELECT volunteer_departments.name AS label, COUNT(volunteer_assignments.id) AS total FROM volunteer_departments LEFT JOIN volunteer_assignments ON volunteer_assignments.department_id = volunteer_departments.id GROUP BY volunteer_departments.id ORDER BY total DESC'),
    pool.query('SELECT volunteers.full_name, AVG(performance_reviews.overall_score) AS score FROM volunteers INNER JOIN performance_reviews ON performance_reviews.volunteer_id = volunteers.id GROUP BY volunteers.id ORDER BY score DESC LIMIT 5'),
    pool.query("SELECT * FROM activity_logs WHERE module LIKE 'volunteer%' OR module IN ('shifts', 'volunteer_attendance') ORDER BY timestamp DESC LIMIT 10"),
  ]);
  res.json({
    metrics: {
      totalVolunteers: num(volunteers[0]?.total),
      activeVolunteers: num(volunteers[0]?.active),
      pendingApplications: num(pending[0]?.total),
      todayShifts: num(todayShifts[0]?.total),
      attendanceRate: attendance[0]?.total ? Math.round((num(attendance[0].present) / num(attendance[0].total)) * 100) : 0,
    },
    departmentDistribution: departments,
    topPerformers,
    recentActivity: activity,
  });
});

const list = (type) => asyncHandler(async (_req, res) => {
  const config = configs[type];
  if (!config) return res.status(404).json({ message: 'Unknown volunteer type' });
  let query = `SELECT * FROM ${config.table} ORDER BY id DESC`;
  if (type === 'assignments') query = `SELECT volunteer_assignments.*, volunteers.full_name, volunteer_departments.name AS department_name FROM volunteer_assignments LEFT JOIN volunteers ON volunteers.id = volunteer_assignments.volunteer_id LEFT JOIN volunteer_departments ON volunteer_departments.id = volunteer_assignments.department_id ORDER BY volunteer_assignments.assigned_at DESC`;
  if (type === 'shifts') query = `SELECT shifts.*, volunteer_departments.name AS department_name FROM shifts LEFT JOIN volunteer_departments ON volunteer_departments.id = shifts.department_id ORDER BY shifts.date DESC, shifts.start_time DESC`;
  const [items] = await pool.query(query);
  res.json({ [config.key]: items, items });
});

const save = (type) => asyncHandler(async (req, res) => {
  const config = configs[type];
  if (!config) return res.status(404).json({ message: 'Unknown volunteer type' });
  const values = await config.values(req.body || {}, req);
  if (req.params.id) await pool.query(`UPDATE ${config.table} SET ${config.fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`, [...values, req.params.id]);
  else {
    const [result] = await pool.query(`INSERT INTO ${config.table} (${config.fields.join(', ')}) VALUES (${config.fields.map(() => '?').join(', ')})`, values);
    req.params.id = result.insertId;
  }
  await log(req, `saved_${type}`, config.table, req.params.id);
  return list(type)(req, res);
});

const bulkStatus = asyncHandler(async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  if (!ids.length) return res.status(400).json({ message: 'ids are required' });
  await pool.query('UPDATE volunteers SET application_status = ? WHERE id IN (?)', [req.body.status, ids]);
  await log(req, 'bulk_updated_volunteers', 'volunteers', ids.join(','), { status: req.body.status });
  res.json({ success: true });
});

const checkIn = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT INTO volunteer_attendance (volunteer_id, check_in_time, location, recorded_by) VALUES (?, NOW(), ?, ?)',
    [req.params.id, clean(req.body.location), req.user?.id || null]
  );
  await log(req, 'checked_in_volunteer', 'volunteer_attendance', result.insertId, { volunteerId: req.params.id });
  res.status(201).json({ id: result.insertId });
});

const reports = asyncHandler(async (_req, res) => {
  const [[departments], [attendance], [top], [coverage], [hours], [workload]] = await Promise.all([
    pool.query('SELECT volunteer_departments.name AS label, COUNT(volunteer_assignments.id) AS total FROM volunteer_departments LEFT JOIN volunteer_assignments ON volunteer_assignments.department_id = volunteer_departments.id GROUP BY volunteer_departments.id'),
    pool.query('SELECT DATE(check_in_time) AS label, COUNT(*) AS total FROM volunteer_attendance GROUP BY label ORDER BY label'),
    pool.query('SELECT volunteers.full_name AS label, AVG(overall_score) AS total FROM performance_reviews INNER JOIN volunteers ON volunteers.id = performance_reviews.volunteer_id GROUP BY volunteers.id ORDER BY total DESC LIMIT 10'),
    pool.query('SELECT shifts.title AS label, COUNT(shift_assignments.id) AS assigned, shifts.capacity AS total FROM shifts LEFT JOIN shift_assignments ON shift_assignments.shift_id = shifts.id GROUP BY shifts.id'),
    pool.query('SELECT volunteers.full_name AS label, SUM(TIMESTAMPDIFF(HOUR, check_in_time, check_out_time)) AS total FROM volunteer_attendance INNER JOIN volunteers ON volunteers.id = volunteer_attendance.volunteer_id GROUP BY volunteers.id ORDER BY total DESC'),
    pool.query('SELECT volunteer_departments.name AS label, COUNT(volunteer_tasks.id) AS total FROM volunteer_departments LEFT JOIN volunteer_tasks ON volunteer_tasks.department_id = volunteer_departments.id GROUP BY volunteer_departments.id'),
  ]);
  res.json({ departments, attendance, topPerformers: top, coverage, hours, workload });
});

const publicSync = asyncHandler(async (_req, res) => {
  const [[departments], [announcements]] = await Promise.all([
    pool.query('SELECT id, name, description FROM volunteer_departments WHERE is_active = TRUE ORDER BY name ASC'),
    pool.query('SELECT * FROM volunteer_announcements WHERE published_at IS NULL OR published_at <= NOW() ORDER BY published_at DESC LIMIT 10'),
  ]);
  res.json({ departments, announcements });
});

module.exports = { bulkStatus, checkIn, dashboard, list, publicSync, reports, save };
