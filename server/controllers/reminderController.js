const crypto = require('crypto');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendTemplateEmail } = require('../services/mailService');
const { buildAbstractReminderEmail } = require('../services/abstractReminderEmailService');

const MAX_ROWS_PER_IMPORT = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value, max = 255) => {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};
const abstractCodes = (value) => String(value ?? '').toUpperCase().match(/GHC-ABS-\d+/g) || [];

const toReminder = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  abstractIds: row.abstract_ids,
  sentAt: row.sent_at,
  sendCount: row.send_count,
  lastAttemptAt: row.last_attempt_at,
  lastError: row.last_error,
  createdAt: row.created_at,
});

const phoneKey = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : null;
};

// Someone with two selected abstracts appears on two rows but gets one reminder, so rows are merged by email
// or phone (some authors used a different email per abstract); the first row's email is the one kept.
const parseImportRows = (rows) => {
  const invalidRows = [];
  const candidates = new Map();
  const byPhone = new Map();
  let mergedInFile = 0;
  rows.forEach((row, index) => {
    const fullName = clean(row?.fullName);
    const email = clean(row?.email);
    const codes = abstractCodes(row?.abstractId);
    if (!fullName || !email || !EMAIL_PATTERN.test(email) || !codes.length) {
      invalidRows.push(index + 1);
      return;
    }
    const key = email.toLowerCase();
    const phone = clean(row?.phone, 50);
    const existing = candidates.get(key) || byPhone.get(phoneKey(phone));
    if (existing) {
      mergedInFile += 1;
      existing.codes = [...new Set([...existing.codes, ...codes])];
      existing.phone = existing.phone || phone;
      if (phoneKey(existing.phone)) byPhone.set(phoneKey(existing.phone), existing);
      return;
    }
    const candidate = { fullName, email, key, phone, codes: [...new Set(codes)] };
    candidates.set(key, candidate);
    if (phoneKey(phone)) byPhone.set(phoneKey(phone), candidate);
  });
  return { list: [...candidates.values()], invalidRows, mergedInFile };
};

const listReminders = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM abstract_reminders ORDER BY created_at DESC, id DESC');
  res.json({ reminders: rows.map(toReminder) });
});

const importReminders = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || !rows.length) return res.status(400).json({ message: 'No rows were provided.' });
  if (rows.length > MAX_ROWS_PER_IMPORT) {
    return res.status(413).json({ message: `Please import at most ${MAX_ROWS_PER_IMPORT} rows at a time.` });
  }

  const { list, invalidRows, mergedInFile } = parseImportRows(rows);
  let added = 0;
  let skippedExisting = [];
  if (list.length) {
    const batch = crypto.randomUUID();
    // INSERT IGNORE + the UNIQUE email_key index: an address already on the list is never added (or emailed) twice.
    const [result] = await pool.query(
      'INSERT IGNORE INTO abstract_reminders (full_name, email, email_key, phone, abstract_ids, import_batch, created_by) VALUES ?',
      [list.map((item) => [item.fullName, item.email, item.key, item.phone, item.codes.join(', '), batch, req.user?.id || null])]
    );
    added = result.affectedRows;
    const [insertedRows] = await pool.query('SELECT email_key FROM abstract_reminders WHERE import_batch = ?', [batch]);
    const inserted = new Set(insertedRows.map((row) => row.email_key));
    skippedExisting = list.filter((item) => !inserted.has(item.key)).map((item) => item.email);
  }

  res.json({ added, skippedExisting, mergedInFile, invalidRows });
});

const sendReminder = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM abstract_reminders WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Reminder not found' });
  // Bulk send passes onlyIfNotSent so someone emailed meanwhile (e.g. by another admin) is skipped.
  if (req.body?.onlyIfNotSent && row.sent_at) {
    return res.status(409).json({ skipped: true, message: `${row.full_name} has already been sent the reminder.`, reminder: toReminder(row) });
  }

  const now = new Date();
  try {
    // The email says the abstract was selected, so only abstracts accepted right now are named in it.
    const [abstracts] = await pool.query(
      "SELECT abstract_id AS code, title FROM abstracts WHERE abstract_id IN (?) AND status = 'accepted' ORDER BY abstract_id",
      [abstractCodes(row.abstract_ids)]
    );
    if (!abstracts.length) throw new Error(`no accepted abstract found for ${row.abstract_ids}`);
    const { attachments, variables } = await buildAbstractReminderEmail({ fullName: row.full_name, abstracts });
    await sendTemplateEmail('abstract_registration_reminder', row.email, variables, { attachments });
  } catch (error) {
    await pool.query('UPDATE abstract_reminders SET last_attempt_at = ?, last_error = ? WHERE id = ?', [now, String(error.message || error).slice(0, 1000), row.id]);
    const [[failed]] = await pool.query('SELECT * FROM abstract_reminders WHERE id = ?', [row.id]);
    return res.status(502).json({ message: `Email to ${row.email} could not be sent: ${error.message}`, reminder: toReminder(failed) });
  }

  await pool.query(
    'UPDATE abstract_reminders SET sent_at = ?, last_attempt_at = ?, last_error = NULL, send_count = send_count + 1 WHERE id = ?',
    [now, now, row.id]
  );
  const [[updated]] = await pool.query('SELECT * FROM abstract_reminders WHERE id = ?', [row.id]);
  res.json({ reminder: toReminder(updated) });
});

const deleteReminder = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM abstract_reminders WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Reminder not found' });
  res.json({ success: true });
});

module.exports = { deleteReminder, importReminders, listReminders, parseImportRows, sendReminder };
