const crypto = require('crypto');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendTemplateEmail } = require('../services/mailService');
const { buildConfirmationEmail } = require('../services/delegateEmailService');

const MAX_ROWS_PER_IMPORT = 2000;

// Private token encoded in the delegate's QR code (registration IDs are sequential and guessable).
const newCheckinToken = () => `GHCDEL-${crypto.randomBytes(18).toString('base64url')}`;

const clean = (value, max = 255) => {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
};

// Two names are the same delegate when they match ignoring case and extra spaces.
const nameKey = (name) => String(name || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();

const toDelegate = (row) => ({
  id: row.id,
  registrationId: row.registration_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  city: row.city,
  isPresent: Boolean(row.is_present),
  attendedAt: row.attended_at,
  confirmationSentAt: row.confirmation_sent_at || null,
  confirmationSendCount: Number(row.confirmation_send_count || 0),
  confirmationLastAttemptAt: row.confirmation_last_attempt_at || null,
  confirmationLastError: row.confirmation_last_error || null,
  createdAt: row.created_at,
});

const listDelegates = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM delegates ORDER BY id ASC');
  const delegates = rows.map(toDelegate);
  const present = delegates.filter((d) => d.isPresent).length;
  res.json({ delegates, stats: { total: delegates.length, present, absent: delegates.length - present } });
});

const importDelegates = asyncHandler(async (req, res) => {
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : null;
  if (!rows || !rows.length) return res.status(400).json({ message: 'No delegate rows were provided.' });
  if (rows.length > MAX_ROWS_PER_IMPORT) {
    return res.status(413).json({ message: `Please import at most ${MAX_ROWS_PER_IMPORT} rows at a time.` });
  }

  const invalid = [];
  const duplicateInFile = [];
  const candidates = new Map();
  rows.forEach((row, index) => {
    const fullName = clean(row?.fullName);
    if (!fullName) {
      invalid.push(index + 1);
      return;
    }
    const key = nameKey(fullName);
    if (candidates.has(key)) {
      duplicateInFile.push(fullName);
      return;
    }
    candidates.set(key, {
      fullName,
      key,
      email: clean(row.email),
      phone: clean(row.phone, 50),
      city: clean(row.city, 150),
    });
  });

  const batch = crypto.randomUUID();
  const list = [...candidates.values()];
  let inserted = [];

  if (list.length) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // INSERT IGNORE + the UNIQUE name_key index: names already in the list are never written again.
      await connection.query(
        `INSERT IGNORE INTO delegates (full_name, name_key, email, phone, city, checkin_token, import_batch, created_by)
         VALUES ?`,
        [list.map((d) => [d.fullName, d.key, d.email, d.phone, d.city, newCheckinToken(), batch, req.user?.id || null])]
      );
      await connection.query(
        "UPDATE delegates SET registration_id = CONCAT('GHC26-DEL-', LPAD(id, 5, '0')) WHERE import_batch = ? AND registration_id IS NULL",
        [batch]
      );
      [inserted] = await connection.query('SELECT name_key FROM delegates WHERE import_batch = ?', [batch]);
      await connection.commit();
    } catch (error) {
      await connection.rollback().catch(() => {});
      throw error;
    } finally {
      connection.release();
    }
  }

  const insertedKeys = new Set(inserted.map((row) => row.name_key));
  const alreadyExisting = list.filter((d) => !insertedKeys.has(d.key)).map((d) => d.fullName);

  res.json({
    added: insertedKeys.size,
    skippedExisting: alreadyExisting,
    skippedDuplicateInFile: duplicateInFile,
    invalidRows: invalid,
  });
});

const setAttendance = asyncHandler(async (req, res) => {
  const present = req.body?.present !== false;
  const [result] = await pool.query(
    'UPDATE delegates SET is_present = ?, attended_at = ?, attendance_marked_by = ? WHERE id = ?',
    [present, present ? new Date() : null, req.user?.id || null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'Delegate not found' });
  const [[row]] = await pool.query('SELECT * FROM delegates WHERE id = ?', [req.params.id]);
  res.json({ delegate: toDelegate(row) });
});

const sendConfirmation = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query('SELECT * FROM delegates WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Delegate not found' });
  // Bulk send passes onlyIfNotSent so a delegate emailed meanwhile (e.g. by another admin) is skipped.
  if (req.body?.onlyIfNotSent && row.confirmation_sent_at) {
    return res.status(409).json({ skipped: true, message: `${row.full_name} has already been sent the confirmation email.`, delegate: toDelegate(row) });
  }
  if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return res.status(400).json({ message: `${row.full_name} does not have a valid email address.` });
  }

  let checkinToken = row.checkin_token;
  if (!checkinToken) {
    checkinToken = newCheckinToken();
    await pool.query('UPDATE delegates SET checkin_token = ? WHERE id = ?', [checkinToken, row.id]);
  }

  try {
    const { attachments, variables } = await buildConfirmationEmail({
      fullName: row.full_name,
      registrationId: row.registration_id,
      email: row.email,
      checkinToken,
    });
    await sendTemplateEmail('delegate_registration_confirmation', row.email, variables, { attachments });
  } catch (error) {
    await pool.query(
      'UPDATE delegates SET confirmation_last_attempt_at = ?, confirmation_last_error = ? WHERE id = ?',
      [new Date(), String(error.message || error).slice(0, 1000), row.id]
    );
    const [[failed]] = await pool.query('SELECT * FROM delegates WHERE id = ?', [row.id]);
    return res.status(502).json({ message: `Email to ${row.email} could not be sent: ${error.message}`, delegate: toDelegate(failed) });
  }

  const now = new Date();
  await pool.query(
    'UPDATE delegates SET confirmation_sent_at = ?, confirmation_last_attempt_at = ?, confirmation_last_error = NULL, confirmation_send_count = confirmation_send_count + 1 WHERE id = ?',
    [now, now, row.id]
  );
  const [[updated]] = await pool.query('SELECT * FROM delegates WHERE id = ?', [row.id]);
  res.json({ delegate: toDelegate(updated), recipient: row.email });
});

// QR scanner check-in: the scanned code must be a delegate's private check-in token.
const checkIn = asyncHandler(async (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (!code) return res.status(400).json({ message: 'No QR code was provided.' });

  const [[row]] = await pool.query('SELECT * FROM delegates WHERE checkin_token = ? LIMIT 1', [code]);
  if (!row) return res.status(404).json({ message: 'This QR code does not belong to any registered delegate.' });

  // Only the first scan marks attendance; the WHERE clause makes concurrent scans safe.
  const [result] = await pool.query(
    'UPDATE delegates SET is_present = TRUE, attended_at = ?, attendance_marked_by = ? WHERE id = ? AND is_present = FALSE',
    [new Date(), req.user?.id || null, row.id]
  );
  const [[updated]] = await pool.query('SELECT * FROM delegates WHERE id = ?', [row.id]);
  res.json({ result: result.affectedRows ? 'marked' : 'already', delegate: toDelegate(updated) });
});

// Sponsor booth scan: each sponsor account can scan a given delegate once (used for booth coupons).
const sponsorScan = asyncHandler(async (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (!code) return res.status(400).json({ message: 'No QR code was provided.' });

  const [[row]] = await pool.query('SELECT id, registration_id, full_name FROM delegates WHERE checkin_token = ? LIMIT 1', [code]);
  if (!row) return res.status(404).json({ message: 'This QR code does not belong to any registered delegate.' });

  // INSERT IGNORE on the unique (sponsor, delegate) key keeps simultaneous scans from both succeeding.
  const [result] = await pool.query(
    'INSERT IGNORE INTO sponsor_scans (sponsor_user_id, delegate_id, scanned_at) VALUES (?, ?, ?)',
    [req.user.id, row.id, new Date()]
  );
  const [[scan]] = await pool.query('SELECT scanned_at FROM sponsor_scans WHERE sponsor_user_id = ? AND delegate_id = ?', [req.user.id, row.id]);
  // Sponsors only get the name and registration ID, not the delegate's contact details.
  res.json({
    result: result.affectedRows ? 'scanned' : 'already',
    delegate: { fullName: row.full_name, registrationId: row.registration_id },
    scannedAt: scan?.scanned_at || null,
  });
});

module.exports = { checkIn, importDelegates, listDelegates, sendConfirmation, setAttendance, sponsorScan };
