const crypto = require('crypto');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendTemplateEmail } = require('../services/mailService');
const { buildInvitationEmail } = require('../services/invitationImageService');

const MAX_ROWS_PER_IMPORT = 2000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value, max = 255) => {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

const toInvite = (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  sentAt: row.sent_at,
  sendCount: row.send_count,
  lastAttemptAt: row.last_attempt_at,
  lastError: row.last_error,
  createdAt: row.created_at,
});

const listInvites = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM invites ORDER BY created_at DESC, id DESC');
  res.json({ invites: rows.map(toInvite) });
});

const importInvites = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || !rows.length) return res.status(400).json({ message: 'No rows were provided.' });
  if (rows.length > MAX_ROWS_PER_IMPORT) {
    return res.status(413).json({ message: `Please import at most ${MAX_ROWS_PER_IMPORT} rows at a time.` });
  }

  const invalidRows = [];
  const duplicateInFile = [];
  const candidates = new Map();
  rows.forEach((row, index) => {
    const fullName = clean(row?.fullName);
    const email = clean(row?.email);
    if (!fullName || !email || !EMAIL_PATTERN.test(email)) {
      invalidRows.push(index + 1);
      return;
    }
    const key = email.toLowerCase();
    if (candidates.has(key)) {
      duplicateInFile.push(email);
      return;
    }
    candidates.set(key, { fullName, email, key });
  });

  const list = [...candidates.values()];
  let added = 0;
  let skippedExisting = [];
  if (list.length) {
    const batch = crypto.randomUUID();
    // INSERT IGNORE + the UNIQUE email_key index: an address already on the list is never added (or emailed) twice.
    const [result] = await pool.query(
      'INSERT IGNORE INTO invites (full_name, email, email_key, import_batch, created_by) VALUES ?',
      [list.map((item) => [item.fullName, item.email, item.key, batch, req.user?.id || null])]
    );
    added = result.affectedRows;
    const [insertedRows] = await pool.query('SELECT email_key FROM invites WHERE import_batch = ?', [batch]);
    const inserted = new Set(insertedRows.map((row) => row.email_key));
    skippedExisting = list.filter((item) => !inserted.has(item.key)).map((item) => item.email);
  }

  res.json({ added, skippedExisting, skippedDuplicateInFile: duplicateInFile, invalidRows });
});

const sendInvite = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM invites WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Invite not found' });
  // Bulk send passes onlyIfNotSent so someone emailed meanwhile (e.g. by another admin) is skipped.
  if (req.body?.onlyIfNotSent && row.sent_at) {
    return res.status(409).json({ skipped: true, message: `${row.full_name} has already been sent the invitation.`, invite: toInvite(row) });
  }

  const now = new Date();
  try {
    // Same design and delivery as the registration confirmation email: images embedded as cid attachments.
    const { attachments, variables } = await buildInvitationEmail({ fullName: row.full_name, email: row.email });
    await sendTemplateEmail('conclave_invitation', row.email, variables, { attachments });
  } catch (error) {
    await pool.query('UPDATE invites SET last_attempt_at = ?, last_error = ? WHERE id = ?', [now, String(error.message || error).slice(0, 1000), row.id]);
    const [[failed]] = await pool.query('SELECT * FROM invites WHERE id = ?', [row.id]);
    return res.status(502).json({ message: `Email to ${row.email} could not be sent: ${error.message}`, invite: toInvite(failed) });
  }

  await pool.query(
    'UPDATE invites SET sent_at = ?, last_attempt_at = ?, last_error = NULL, send_count = send_count + 1 WHERE id = ?',
    [now, now, row.id]
  );
  const [[updated]] = await pool.query('SELECT * FROM invites WHERE id = ?', [row.id]);
  res.json({ invite: toInvite(updated) });
});

const deleteInvite = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM invites WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Invite not found' });
  res.json({ success: true });
});

module.exports = { deleteInvite, importInvites, listInvites, sendInvite };
