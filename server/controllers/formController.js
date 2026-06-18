const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const slugify = (value) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `form-${Date.now()}`;

const parseJson = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const bool = (value) => value === true || value === 'true' || value === 1 || value === '1';

const audit = async (req, { formId = null, submissionId = null, action, metadata = null }) => {
  await pool.query(
    'INSERT INTO form_audit_logs (form_id, submission_id, user_id, action, metadata, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
    [formId, submissionId, req.user?.id || null, action, metadata ? JSON.stringify(metadata) : null, req.ip || req.socket?.remoteAddress || null]
  );
};

const getFormWithFields = async (idOrSlug, publishedOnly = false) => {
  const [forms] = await pool.query(
    `SELECT forms.*, teams.name AS team_name, users.name AS creator_name
     FROM forms
     LEFT JOIN teams ON teams.id = forms.team_id
     LEFT JOIN users ON users.id = forms.created_by
     WHERE (${Number(idOrSlug) ? 'forms.id = ?' : 'forms.slug = ?'})
       ${publishedOnly ? "AND forms.status = 'published'" : ''}
     LIMIT 1`,
    [idOrSlug]
  );
  const form = forms[0];
  if (!form) return null;

  const [fields] = await pool.query('SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order ASC, id ASC', [form.id]);
  const fieldIds = fields.map((field) => field.id);
  const [options] = fieldIds.length
    ? await pool.query('SELECT * FROM field_options WHERE field_id IN (?) ORDER BY option_order ASC, id ASC', [fieldIds])
    : [[]];
  const optionsByField = options.reduce((acc, option) => {
    acc[option.field_id] = [...(acc[option.field_id] || []), option];
    return acc;
  }, {});

  return {
    ...form,
    validation_rules: parseJson(form.validation_rules, null),
    fields: fields.map((field) => ({
      ...field,
      validation_rules: parseJson(field.validation_rules, {}),
      conditional_logic: parseJson(field.conditional_logic, {}),
      options: optionsByField[field.id] || [],
    })),
  };
};

const saveFields = async (formId, fields = []) => {
  await pool.query('DELETE FROM form_fields WHERE form_id = ?', [formId]);
  for (const [index, field] of fields.entries()) {
    const fieldName = slugify(field.fieldName || field.field_name || field.fieldLabel || field.field_label || `field-${index + 1}`).replace(/-/g, '_');
    const [result] = await pool.query(
      `INSERT INTO form_fields
        (form_id, field_label, field_name, field_type, required, placeholder, field_order, validation_rules, conditional_logic, help_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        formId,
        field.fieldLabel || field.field_label || field.label || 'Untitled field',
        fieldName,
        field.fieldType || field.field_type || 'short_text',
        bool(field.required),
        field.placeholder || null,
        Number(field.fieldOrder ?? field.field_order ?? index),
        JSON.stringify(field.validationRules || field.validation_rules || {}),
        JSON.stringify(field.conditionalLogic || field.conditional_logic || {}),
        field.helpText || field.help_text || null,
      ]
    );
    const options = field.options || [];
    for (const [optionIndex, option] of options.entries()) {
      const display = option.displayText || option.display_text || option.label || option.value || option.option_value;
      await pool.query(
        'INSERT INTO field_options (field_id, option_value, display_text, option_order) VALUES (?, ?, ?, ?)',
        [result.insertId, option.optionValue || option.option_value || slugify(display), display, optionIndex]
      );
    }
  }
};

const dashboard = asyncHandler(async (_req, res) => {
  const [[totals]] = await pool.query(`
    SELECT
      COUNT(*) AS totalForms,
      SUM(status = 'published') AS activeForms
    FROM forms
  `);
  const [[submissions]] = await pool.query(`
    SELECT
      SUM(DATE(submitted_at) = CURDATE()) AS submissionsToday,
      SUM(status IN ('submitted','under_review')) AS pendingReviews,
      AVG(status = 'approved') * 100 AS approvalRate
    FROM form_submissions
  `);
  const [recentSubmissions] = await pool.query(`
    SELECT form_submissions.*, forms.title AS form_title
    FROM form_submissions
    INNER JOIN forms ON forms.id = form_submissions.form_id
    ORDER BY form_submissions.submitted_at DESC
    LIMIT 10
  `);
  res.json({ totals: { ...totals, ...submissions }, recentSubmissions });
});

const listForms = asyncHandler(async (req, res) => {
  const params = [];
  const where = [];
  if (req.query.status) {
    where.push('forms.status = ?');
    params.push(req.query.status);
  }
  if (req.query.search) {
    where.push('(forms.title LIKE ? OR forms.slug LIKE ? OR forms.category LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  const [forms] = await pool.query(
    `SELECT forms.*, teams.name AS team_name, COUNT(form_submissions.id) AS submissions_count
     FROM forms
     LEFT JOIN teams ON teams.id = forms.team_id
     LEFT JOIN form_submissions ON form_submissions.form_id = forms.id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     GROUP BY forms.id
     ORDER BY forms.created_at DESC`,
    params
  );
  res.json({ forms });
});

const metadata = asyncHandler(async (_req, res) => {
  const [teams] = await pool.query('SELECT id, name FROM teams WHERE is_active = TRUE ORDER BY name');
  const [templates] = await pool.query('SELECT * FROM form_templates WHERE is_active = TRUE ORDER BY title');
  res.json({ teams, templates });
});

const getForm = asyncHandler(async (req, res) => {
  const form = await getFormWithFields(req.params.id);
  if (!form) return res.status(404).json({ message: 'Form not found' });
  return res.json({ form });
});

const saveForm = asyncHandler(async (req, res) => {
  const fields = parseJson(req.body.fields, []);
  const title = req.body.title?.trim();
  if (!title) return res.status(400).json({ message: 'Form title is required' });

  const payload = [
    title,
    req.body.slug ? slugify(req.body.slug) : slugify(title),
    req.body.description || null,
    req.body.category || 'application',
    req.body.status || 'draft',
    req.body.teamId || req.body.team_id || null,
    bool(req.body.allowMultipleSubmissions ?? req.body.allow_multiple_submissions),
    req.body.submissionLimit || req.body.submission_limit || null,
    req.body.startDate || req.body.start_date || null,
    req.body.endDate || req.body.end_date || null,
    bool(req.body.autoClose ?? req.body.auto_close),
    req.body.successMessage || req.body.success_message || 'Thank you. Your response has been submitted.',
    req.body.redirectUrl || req.body.redirect_url || null,
    bool(req.body.emailNotifications ?? req.body.email_notifications),
    req.body.notificationEmails || req.body.notification_emails || null,
    bool(req.body.allowEditing ?? req.body.allow_editing),
    bool(req.body.anonymousResponses ?? req.body.anonymous_responses),
    bool(req.body.recaptchaEnabled ?? req.body.recaptcha_enabled),
    Number(req.body.maxFileSizeMb || req.body.max_file_size_mb || 10),
    req.body.allowedFileFormats || req.body.allowed_file_formats || 'jpg,jpeg,png,pdf,ppt,pptx,doc,docx,zip',
    bool(req.body.embedEnabled ?? req.body.embed_enabled ?? true),
    req.user?.id || null,
  ];

  let formId = req.params.id;
  if (formId) {
    const before = await getFormWithFields(formId);
    await pool.query(
      `UPDATE forms SET title=?, slug=?, description=?, category=?, status=?, team_id=?, allow_multiple_submissions=?,
       submission_limit=?, start_date=?, end_date=?, auto_close=?, success_message=?, redirect_url=?, email_notifications=?,
       notification_emails=?, allow_editing=?, anonymous_responses=?, recaptcha_enabled=?, max_file_size_mb=?,
       allowed_file_formats=?, embed_enabled=? WHERE id=?`,
      [...payload.slice(0, -1), formId]
    );
    await saveFields(formId, fields);
    await audit(req, { formId, action: 'updated_form', metadata: { beforeTitle: before?.title, title } });
  } else {
    const [result] = await pool.query(
      `INSERT INTO forms
        (title, slug, description, category, status, team_id, allow_multiple_submissions, submission_limit, start_date, end_date,
         auto_close, success_message, redirect_url, email_notifications, notification_emails, allow_editing, anonymous_responses,
         recaptcha_enabled, max_file_size_mb, allowed_file_formats, embed_enabled, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      payload
    );
    formId = result.insertId;
    await saveFields(formId, fields);
    await audit(req, { formId, action: 'created_form', metadata: { title } });
  }

  const form = await getFormWithFields(formId);
  return res.status(req.params.id ? 200 : 201).json({ form });
});

const removeForm = asyncHandler(async (req, res) => {
  const form = await getFormWithFields(req.params.id);
  if (!form) return res.status(404).json({ message: 'Form not found' });
  await pool.query('DELETE FROM forms WHERE id = ?', [req.params.id]);
  await audit(req, { action: 'deleted_form', metadata: { id: req.params.id, title: form.title } });
  return res.json({ success: true });
});

const publicForm = asyncHandler(async (req, res) => {
  const form = await getFormWithFields(req.params.slug, true);
  if (!form) return res.status(404).json({ message: 'Form not found' });
  const now = new Date();
  if ((form.start_date && now < new Date(form.start_date)) || (form.end_date && now > new Date(form.end_date))) {
    return res.status(403).json({ message: 'This form is not currently accepting responses' });
  }
  await pool.query('UPDATE forms SET view_count = view_count + 1 WHERE id = ?', [form.id]);
  await pool.query('INSERT INTO form_views (form_id, ip_address, user_agent) VALUES (?, ?, ?)', [form.id, req.ip || req.socket?.remoteAddress || null, req.headers['user-agent'] || null]);
  return res.json({ form });
});

const submitForm = asyncHandler(async (req, res) => {
  const form = await getFormWithFields(req.params.slug, true);
  if (!form) return res.status(404).json({ message: 'Form not found' });
  if (form.submission_limit) {
    const [[count]] = await pool.query('SELECT COUNT(*) AS count FROM form_submissions WHERE form_id = ?', [form.id]);
    if (Number(count.count) >= Number(form.submission_limit)) {
      return res.status(403).json({ message: 'Submission limit reached' });
    }
  }

  const submissionData = parseJson(req.body.submissionData || req.body.submission_data, req.body);
  const submissionCode = `GHC-FORM-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
  const [result] = await pool.query(
    'INSERT INTO form_submissions (form_id, submission_id, submitted_by, submission_data, status) VALUES (?, ?, ?, ?, ?)',
    [form.id, submissionCode, req.user?.id || null, JSON.stringify(submissionData), 'submitted']
  );

  const fieldsByName = Object.fromEntries(form.fields.map((field) => [field.field_name, field]));
  for (const file of req.files || []) {
    const uploaded = await uploadToCloudinary(file.path, 'forms', { resourceType: 'auto', transform: false });
    const field = fieldsByName[file.fieldname];
    await pool.query(
      'INSERT INTO submission_files (submission_id, field_id, file_url, file_type, original_name, public_id) VALUES (?, ?, ?, ?, ?, ?)',
      [result.insertId, field?.id || null, uploaded.secure_url, file.mimetype, file.originalname, uploaded.public_id]
    );
  }

  await audit(req, { formId: form.id, submissionId: result.insertId, action: 'submitted_form', metadata: { submissionId: submissionCode } });
  return res.status(201).json({ submissionId: submissionCode, message: form.success_message });
});

const listSubmissions = asyncHandler(async (req, res) => {
  const [submissions] = await pool.query(
    `SELECT form_submissions.*, users.name AS reviewer_name
     FROM form_submissions
     LEFT JOIN users ON users.id = form_submissions.reviewer_id
     WHERE form_submissions.form_id = ?
     ORDER BY form_submissions.submitted_at DESC`,
    [req.params.id]
  );
  res.json({ submissions: submissions.map((item) => ({ ...item, submission_data: parseJson(item.submission_data, {}) })) });
});

const getSubmission = asyncHandler(async (req, res) => {
  const [[submission]] = await pool.query('SELECT * FROM form_submissions WHERE id = ?', [req.params.submissionId]);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  const [files] = await pool.query('SELECT * FROM submission_files WHERE submission_id = ?', [submission.id]);
  const [notes] = await pool.query('SELECT submission_notes.*, users.name AS added_by_name FROM submission_notes LEFT JOIN users ON users.id = submission_notes.added_by WHERE submission_id = ? ORDER BY created_at DESC', [submission.id]);
  return res.json({ submission: { ...submission, submission_data: parseJson(submission.submission_data, {}), files, notes } });
});

const updateSubmission = asyncHandler(async (req, res) => {
  const { status, customStatus, reviewerId } = req.body;
  await pool.query('UPDATE form_submissions SET status = ?, custom_status = ?, reviewer_id = ? WHERE id = ?', [
    status || 'under_review',
    customStatus || null,
    reviewerId || req.user?.id || null,
    req.params.submissionId,
  ]);
  await audit(req, { formId: req.params.id, submissionId: req.params.submissionId, action: `submission_${status || 'updated'}`, metadata: req.body });
  res.json({ success: true });
});

const addNote = asyncHandler(async (req, res) => {
  if (!req.body.note?.trim()) return res.status(400).json({ message: 'Note is required' });
  const [result] = await pool.query('INSERT INTO submission_notes (submission_id, added_by, note) VALUES (?, ?, ?)', [req.params.submissionId, req.user?.id || null, req.body.note]);
  await audit(req, { formId: req.params.id, submissionId: req.params.submissionId, action: 'added_submission_note' });
  res.status(201).json({ id: result.insertId });
});

const exportSubmissionsCsv = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT submission_id, status, custom_status, submission_data, submitted_at FROM form_submissions WHERE form_id = ? ORDER BY submitted_at DESC', [req.params.id]);
  const parsed = rows.map((row) => ({ ...row, submission_data: parseJson(row.submission_data, {}) }));
  const dynamicKeys = Array.from(new Set(parsed.flatMap((row) => Object.keys(row.submission_data || {}))));
  const header = ['submission_id', 'status', 'custom_status', 'submitted_at', ...dynamicKeys];
  const csv = [header, ...parsed.map((row) => header.map((key) => key in row ? row[key] : row.submission_data?.[key]))]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="form-${req.params.id}-submissions.csv"`);
  await audit(req, { formId: req.params.id, action: 'exported_submissions_csv' });
  res.send(csv);
});

const submissionPdf = asyncHandler(async (req, res) => {
  const [[submission]] = await pool.query('SELECT form_submissions.*, forms.title FROM form_submissions INNER JOIN forms ON forms.id = form_submissions.form_id WHERE form_submissions.id = ?', [req.params.submissionId]);
  if (!submission) return res.status(404).json({ message: 'Submission not found' });
  const data = parseJson(submission.submission_data, {});
  const doc = new PDFDocument({ margin: 48 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${submission.submission_id}.pdf"`);
  doc.pipe(res);
  doc.fontSize(18).text(submission.title);
  doc.moveDown().fontSize(11).text(`Submission ID: ${submission.submission_id}`);
  doc.text(`Status: ${submission.status}`);
  doc.text(`Submitted: ${submission.submitted_at}`);
  doc.moveDown();
  Object.entries(data).forEach(([key, value]) => {
    doc.font('Helvetica-Bold').text(key);
    doc.font('Helvetica').text(Array.isArray(value) ? value.join(', ') : String(value ?? '-'));
    doc.moveDown(0.5);
  });
  await audit(req, { formId: submission.form_id, submissionId: submission.id, action: 'exported_submission_pdf' });
  doc.end();
});

const analytics = asyncHandler(async (_req, res) => {
  const [[summary]] = await pool.query(`
    SELECT
      COUNT(DISTINCT forms.id) AS forms,
      SUM(forms.view_count) AS views,
      COUNT(form_submissions.id) AS submissions,
      AVG(form_submissions.status = 'approved') * 100 AS approvalRate
    FROM forms
    LEFT JOIN form_submissions ON form_submissions.form_id = forms.id
  `);
  const [byDay] = await pool.query("SELECT DATE(submitted_at) AS label, COUNT(*) AS total FROM form_submissions GROUP BY label ORDER BY label DESC LIMIT 30");
  const [activeForms] = await pool.query(`
    SELECT forms.id, forms.title, forms.slug, forms.view_count, COUNT(form_submissions.id) AS submissions
    FROM forms
    LEFT JOIN form_submissions ON form_submissions.form_id = forms.id
    GROUP BY forms.id
    ORDER BY submissions DESC, forms.view_count DESC
    LIMIT 10
  `);
  res.json({ summary, byDay, activeForms });
});

module.exports = {
  addNote,
  analytics,
  dashboard,
  exportSubmissionsCsv,
  getForm,
  getSubmission,
  listForms,
  listSubmissions,
  metadata,
  publicForm,
  removeForm,
  saveForm,
  submissionPdf,
  submitForm,
  updateSubmission,
};
