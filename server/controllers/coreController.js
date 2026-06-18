const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity, logAudit, parseJson, queueNotification, saveFile, search, slugify } = require('../services/coreServices');

const moduleEntityWhere = (req) => [req.query.module || req.body.module, req.query.entityType || req.body.entityType || req.query.entity_type || req.body.entity_type, req.query.entityId || req.body.entityId || req.query.entity_id || req.body.entity_id];

const dashboard = asyncHandler(async (_req, res) => {
  const [[files], [tasks], [approvals], [activity], [widgets]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM files'),
    pool.query("SELECT COUNT(*) AS total, SUM(status IN ('pending','in_progress','blocked')) AS open_count FROM tasks"),
    pool.query("SELECT COUNT(*) AS total, SUM(status = 'pending') AS pending FROM approval_requests"),
    pool.query('SELECT activity_logs.*, users.name AS user_name FROM activity_logs LEFT JOIN users ON users.id = activity_logs.user_id ORDER BY timestamp DESC LIMIT 12'),
    pool.query('SELECT * FROM dashboard_widgets WHERE is_active = TRUE ORDER BY display_order ASC'),
  ]);
  res.json({
    metrics: {
      files: Number(files[0]?.total || 0),
      openTasks: Number(tasks[0]?.open_count || 0),
      approvalRequests: Number(approvals[0]?.total || 0),
      pendingApprovals: Number(approvals[0]?.pending || 0),
    },
    activity,
    widgets: widgets.map((widget) => ({ ...widget, config: parseJson(widget.config, {}) })),
  });
});

const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File is required' });
  const saved = await saveFile({
    file: req.file,
    module: req.body.module,
    entityType: req.body.entityType || req.body.entity_type,
    entityId: req.body.entityId || req.body.entity_id,
    uploadedBy: req.user?.id || null,
    eventId: req.body.eventId || req.body.event_id || null,
    metadata: req.body.metadata ? parseJson(req.body.metadata, {}) : null,
  });
  await logAudit({ userId: req.user?.id, action: 'uploaded_file', module: req.body.module, recordType: 'files', recordId: saved.id, newValues: saved, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  res.status(201).json({ file: saved });
});

const files = asyncHandler(async (req, res) => {
  const [module, entityType, entityId] = moduleEntityWhere(req);
  const clauses = [];
  const params = [];
  if (module) { clauses.push('module = ?'); params.push(module); }
  if (entityType) { clauses.push('entity_type = ?'); params.push(entityType); }
  if (entityId) { clauses.push('entity_id = ?'); params.push(entityId); }
  const [rows] = await pool.query(`SELECT * FROM files ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 200`, params);
  res.json({ files: rows });
});

const tags = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM tags ORDER BY name ASC');
    return res.json({ tags: rows });
  }
  const slug = slugify(req.body.slug || req.body.name);
  const [result] = await pool.query(
    'INSERT INTO tags (name, slug, color) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE color = VALUES(color)',
    [req.body.name, slug, req.body.color || null]
  );
  return res.status(201).json({ id: result.insertId, slug });
});

const attachTag = asyncHandler(async (req, res) => {
  const [result] = await pool.query(
    'INSERT IGNORE INTO taggings (tag_id, module, entity_type, entity_id, created_by) VALUES (?, ?, ?, ?, ?)',
    [req.body.tagId || req.body.tag_id, req.body.module, req.body.entityType || req.body.entity_type, req.body.entityId || req.body.entity_id, req.user?.id || null]
  );
  await logActivity({ userId: req.user?.id, action: 'tagged_record', module: req.body.module, recordId: req.body.entityId || req.body.entity_id });
  res.status(201).json({ id: result.insertId });
});

const comments = asyncHandler(async (req, res) => {
  const [module, entityType, entityId] = moduleEntityWhere(req);
  if (req.method === 'GET') {
    const [rows] = await pool.query(
      'SELECT comments.*, users.name AS user_name FROM comments LEFT JOIN users ON users.id = comments.user_id WHERE module = ? AND entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [module, entityType, entityId]
    );
    return res.json({ comments: rows });
  }
  const [result] = await pool.query(
    'INSERT INTO comments (module, entity_type, entity_id, user_id, comment, visibility) VALUES (?, ?, ?, ?, ?, ?)',
    [module, entityType, entityId, req.user?.id || null, req.body.comment, req.body.visibility || 'internal']
  );
  await logActivity({ userId: req.user?.id, action: 'added_comment', module, recordId: entityId });
  return res.status(201).json({ id: result.insertId });
});

const tasks = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT tasks.*, users.name AS assigned_to_name FROM tasks LEFT JOIN users ON users.id = tasks.assigned_to ORDER BY due_date IS NULL, due_date ASC, created_at DESC LIMIT 300');
    return res.json({ tasks: rows });
  }
  const fields = ['title', 'description', 'assigned_to', 'department', 'module', 'entity_type', 'entity_id', 'event_id', 'status', 'priority', 'due_date'];
  const data = Object.fromEntries(fields.map((field) => [field, req.body[field] ?? null]));
  data.status = data.status || 'pending';
  data.priority = data.priority || 'medium';
  const [result] = await pool.query(
    `INSERT INTO tasks (${fields.join(', ')}, created_by) VALUES (${fields.map(() => '?').join(', ')}, ?)`,
    [...fields.map((field) => data[field]), req.user?.id || null]
  );
  await logActivity({ userId: req.user?.id, action: 'created_task', module: data.module || 'core', recordId: String(result.insertId) });
  return res.status(201).json({ id: result.insertId });
});

const updateTask = asyncHandler(async (req, res) => {
  const [[before]] = await pool.query('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
  await pool.query('UPDATE tasks SET status = ?, priority = ?, assigned_to = ?, due_date = ? WHERE id = ?', [req.body.status, req.body.priority, req.body.assigned_to || req.body.assignedTo || null, req.body.due_date || req.body.dueDate || null, req.params.id]);
  await logAudit({ userId: req.user?.id, action: 'updated_task', module: 'tasks', recordType: 'tasks', recordId: req.params.id, oldValues: before, newValues: req.body, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  res.json({ success: true });
});

const approvals = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT approval_requests.*, requester.name AS requested_by_name, assignee.name AS assigned_to_name FROM approval_requests LEFT JOIN users requester ON requester.id = approval_requests.requested_by LEFT JOIN users assignee ON assignee.id = approval_requests.assigned_to ORDER BY created_at DESC LIMIT 300');
    return res.json({ approvals: rows.map((row) => ({ ...row, before_state: parseJson(row.before_state, null), after_state: parseJson(row.after_state, null) })) });
  }
  const [result] = await pool.query(
    'INSERT INTO approval_requests (module, record_id, requested_by, assigned_to, before_state, after_state, event_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.body.module, req.body.recordId || req.body.record_id, req.user?.id || null, req.body.assignedTo || req.body.assigned_to || null, JSON.stringify(req.body.beforeState || null), JSON.stringify(req.body.afterState || null), req.body.eventId || null]
  );
  await logActivity({ userId: req.user?.id, action: 'requested_approval', module: req.body.module, recordId: req.body.recordId || req.body.record_id });
  res.status(201).json({ id: result.insertId });
});

const decideApproval = asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Status must be approved or rejected' });
  const [[before]] = await pool.query('SELECT * FROM approval_requests WHERE id = ?', [req.params.id]);
  await pool.query('UPDATE approval_requests SET status = ?, decision_notes = ?, decided_at = NOW(), assigned_to = COALESCE(assigned_to, ?) WHERE id = ?', [status, req.body.decisionNotes || req.body.decision_notes || null, req.user?.id || null, req.params.id]);
  await logAudit({ userId: req.user?.id, action: `${status}_approval`, module: before?.module || 'approvals', recordType: 'approval_requests', recordId: req.params.id, oldValues: before, newValues: req.body, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  res.json({ success: true });
});

const notifications = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM notification_events ORDER BY created_at DESC LIMIT 300');
    return res.json({ notifications: rows });
  }
  const id = await queueNotification({ recipientId: req.body.recipientId || req.body.recipient_id || null, title: req.body.title, message: req.body.message, channel: req.body.channel || 'in_app', module: req.body.module || 'core' });
  res.status(201).json({ id });
});

const globalSearch = asyncHandler(async (req, res) => {
  const results = await search(req.query.q, req.query.limit || 8);
  res.json({ results });
});

const settings = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM settings ORDER BY scope ASC, setting_key ASC');
    return res.json({ settings: rows.map((row) => ({ ...row, setting_value: parseJson(row.setting_value, {}) })) });
  }
  await pool.query(
    `INSERT INTO settings (setting_key, setting_value, scope, event_id, updated_by)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), scope = VALUES(scope), event_id = VALUES(event_id), updated_by = VALUES(updated_by)`,
    [req.body.key || req.body.setting_key, JSON.stringify(req.body.value || req.body.setting_value || {}), req.body.scope || 'global', req.body.eventId || req.body.event_id || null, req.user?.id || null]
  );
  res.json({ success: true });
});

const events = asyncHandler(async (req, res) => {
  if (req.method === 'GET') {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY COALESCE(start_date, DATE(start_datetime)) DESC, id DESC');
    return res.json({ events: rows });
  }
  const slug = slugify(req.body.slug || req.body.name || req.body.title);
  const [result] = await pool.query(
    `INSERT INTO events (title, name, slug, year, start_date, end_date, venue, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), year = VALUES(year), start_date = VALUES(start_date), end_date = VALUES(end_date), venue = VALUES(venue), status = VALUES(status)`,
    [req.body.title || req.body.name, req.body.name || req.body.title, slug, req.body.year || null, req.body.startDate || req.body.start_date || null, req.body.endDate || req.body.end_date || null, req.body.venue || null, req.body.status || 'draft']
  );
  res.status(201).json({ id: result.insertId, slug });
});

const reportCsv = asyncHandler(async (_req, res) => {
  const [[users], [files], [tasks], [approvals]] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM users'),
    pool.query('SELECT COUNT(*) AS total FROM files'),
    pool.query('SELECT status, COUNT(*) AS total FROM tasks GROUP BY status'),
    pool.query('SELECT status, COUNT(*) AS total FROM approval_requests GROUP BY status'),
  ]);
  const rows = [
    ['metric', 'value'],
    ['users', users[0]?.total || 0],
    ['files', files[0]?.total || 0],
    ...tasks.map((row) => [`tasks_${row.status}`, row.total]),
    ...approvals.map((row) => [`approvals_${row.status}`, row.total]),
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="ghc-core-report.csv"');
  res.send(rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n'));
});

module.exports = {
  approvals,
  attachTag,
  comments,
  dashboard,
  decideApproval,
  events,
  files,
  globalSearch,
  notifications,
  reportCsv,
  settings,
  tags,
  tasks,
  updateTask,
  uploadFile,
};
