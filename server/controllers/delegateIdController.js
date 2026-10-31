const crypto = require('crypto');
const { pool } = require('../config/db');
const cloudinary = require('../config/cloudinary');
const asyncHandler = require('../utils/asyncHandler');
const { decryptIdNumber, encryptIdNumber, getKey } = require('../utils/idEncryption');
const { sendTemplateEmail } = require('../services/mailService');
const { EVENT } = require('../services/delegateEmailService');
const { buildDelegateIdEmail } = require('../services/delegateIdEmailService');

const ID_TYPES = {
  passport: { label: 'Passport', pattern: /^[A-Z0-9]{6,12}$/ },
  driving_licence: { label: 'Driving Licence', pattern: /^[A-Z0-9/-]{8,20}$/ },
  pan: { label: 'PAN Card', pattern: /^[A-Z]{5}\d{4}[A-Z]$/ },
  voter_id: { label: 'Voter ID', pattern: /^[A-Z0-9/]{8,14}$/ },
  // Full Aadhaar numbers are never stored: only the last 4 digits and a masked copy.
  aadhaar_masked: { label: 'Masked Aadhaar', pattern: /^\d{4}$/ },
};
const REVIEW_STATUSES = ['verified', 'rejected'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCAN_ACCESS_MINUTES = 10;

const newIdToken = () => crypto.randomBytes(24).toString('base64url');
const lastFour = (number) => String(number).slice(-4);
const logAccess = (delegateId, userId, action) =>
  pool.query('INSERT INTO delegate_id_access_log (delegate_id, user_id, action, created_at) VALUES (?, ?, ?, ?)', [delegateId, userId || null, action, new Date()]);

// Trust boundary: everything on the public form is checked here. Returns { error } or { value }.
const parseIdSubmission = (body = {}) => {
  const nameOnId = String(body.nameOnId ?? '').replace(/\s+/g, ' ').trim();
  const idType = String(body.idType ?? '');
  const phone = String(body.phone ?? '').replace(/[\s()-]/g, '');
  const type = Object.prototype.hasOwnProperty.call(ID_TYPES, idType) ? ID_TYPES[idType] : null;
  if (nameOnId.length < 2 || nameOnId.length > 150) return { error: 'Please enter your name exactly as it appears on your ID.' };
  if (!type) return { error: 'Please choose a valid ID type.' };
  if (!/^\+?\d{10,15}$/.test(phone)) return { error: 'Please enter a valid phone number.' };
  if (String(body.consent) !== 'true') return { error: 'Please give your consent to continue.' };

  const idNumber = idType === 'aadhaar_masked'
    ? String(body.idNumber ?? '').replace(/\D/g, '')
    : String(body.idNumber ?? '').toUpperCase().replace(/\s/g, '');
  if (idType === 'aadhaar_masked' && idNumber.length >= 12) {
    return { error: 'Please enter only the last 4 digits of your Aadhaar, not the full number.' };
  }
  if (!type.pattern.test(idNumber)) return { error: `Please enter a valid ${type.label} number.` };
  return { value: { nameOnId, idType, idNumber, phone } };
};

const toIdSummary = (row) => ({
  status: row.id_status,
  idType: row.id_type,
  idTypeLabel: ID_TYPES[row.id_type]?.label || row.id_type,
  nameOnId: row.name_on_id,
  phone: row.id_phone,
  numberLast4: lastFour(decryptIdNumber(row.id_number_enc)),
  rejectionReason: row.rejection_reason || null,
  submittedAt: row.submitted_at,
  reviewedAt: row.reviewed_at,
});

const DELEGATE_WITH_ID = `
  SELECT d.*, i.status AS id_status, i.id_type, i.name_on_id, i.phone AS id_phone, i.id_number_enc,
    i.rejection_reason, i.submitted_at, i.reviewed_at
  FROM delegates d LEFT JOIN delegate_ids i ON i.delegate_id = d.id`;

const toDelegateRow = (row) => ({
  id: row.id,
  registrationId: row.registration_id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  requestSentAt: row.id_request_sent_at || null,
  requestSendCount: Number(row.id_request_send_count || 0),
  requestLastAttemptAt: row.id_request_last_attempt_at || null,
  requestLastError: row.id_request_last_error || null,
  submission: row.id_status ? toIdSummary(row) : null,
});

const getIdForm = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.id_token = ? LIMIT 1`, [req.params.token]);
  if (!row) return res.status(404).json({ message: 'This link is not valid. Please use the link from your email.' });
  const submission = row.id_status ? toIdSummary(row) : null;
  res.json({
    fullName: row.full_name,
    registrationId: row.registration_id,
    // Imported spreadsheets left some numbers as 9.18E+11, so those are not offered as the default.
    phone: /^\+?[\d\s-]{10,}$/.test(row.phone || '') ? row.phone : '',
    idTypes: Object.entries(ID_TYPES).map(([value, { label }]) => ({ value, label })),
    submission: submission && { ...submission, phone: undefined },
  });
});

const uploadIdImage = (buffer) => new Promise((resolve, reject) => {
  // type: authenticated keeps the original private; it can only be fetched through the signed API call below.
  cloudinary.uploader.upload_stream({
    type: 'authenticated',
    resource_type: 'image',
    folder: 'ghc/delegate-ids',
    public_id: crypto.randomBytes(16).toString('hex'),
    format: 'jpg',
    transformation: [{ width: 1600, height: 1600, crop: 'limit', quality: 'auto:good' }],
  }, (error, result) => (error ? reject(error) : resolve(result))).end(buffer);
});

const destroyIdImage = (publicId) =>
  cloudinary.uploader.destroy(publicId, { type: 'authenticated', resource_type: 'image', invalidate: true });

const submitIdForm = asyncHandler(async (req, res) => {
  getKey(); // Fail before uploading anything if the number could not be stored safely.
  const [[delegate]] = await pool.query('SELECT id FROM delegates WHERE id_token = ? LIMIT 1', [req.params.token]);
  if (!delegate) return res.status(404).json({ message: 'This link is not valid. Please use the link from your email.' });

  const { error, value } = parseIdSubmission(req.body);
  if (error) return res.status(400).json({ message: error });
  if (!req.file) return res.status(400).json({ message: 'Please upload a photo of your ID.' });

  const [[existing]] = await pool.query('SELECT status, image_public_id FROM delegate_ids WHERE delegate_id = ?', [delegate.id]);
  if (existing?.status === 'verified') return res.status(409).json({ message: 'Your ID has already been verified. No further action is needed.' });

  let image;
  try {
    image = await uploadIdImage(req.file.buffer);
  } catch {
    return res.status(400).json({ message: 'That image could not be read. Please upload a clear JPG or PNG photo.' });
  }

  const now = new Date();
  await pool.query(
    `INSERT INTO delegate_ids (delegate_id, name_on_id, id_type, id_number_enc, phone, image_public_id, status, consent_at, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
     ON DUPLICATE KEY UPDATE name_on_id = VALUES(name_on_id), id_type = VALUES(id_type), id_number_enc = VALUES(id_number_enc),
       phone = VALUES(phone), image_public_id = VALUES(image_public_id), status = 'pending', consent_at = VALUES(consent_at),
       submitted_at = VALUES(submitted_at), rejection_reason = NULL, reviewed_by = NULL, reviewed_at = NULL`,
    [delegate.id, value.nameOnId, value.idType, encryptIdNumber(value.idNumber), value.phone, image.public_id, now, now]
  );
  // A replaced ID must not linger in storage; a failed delete is logged rather than failing the delegate's submission.
  if (existing?.image_public_id) {
    await destroyIdImage(existing.image_public_id).catch((err) => console.error('Old ID image not deleted:', existing.image_public_id, err.message));
  }
  res.json({ success: true });
});

const listDelegateIds = asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`${DELEGATE_WITH_ID} ORDER BY d.id ASC`);
  res.json({ delegates: rows.map(toDelegateRow) });
});

const sendIdRequest = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.id = ?`, [req.params.id]);
  if (!row) return res.status(404).json({ message: 'Delegate not found' });
  // Bulk send passes onlyIfNotSent so a delegate emailed meanwhile (e.g. by another admin) is skipped.
  if (req.body?.onlyIfNotSent && (row.id_request_sent_at || row.id_status)) {
    return res.status(409).json({ skipped: true, message: `${row.full_name} has already been sent the ID request.`, delegate: toDelegateRow(row) });
  }
  if (!row.email || !EMAIL_PATTERN.test(row.email)) {
    return res.status(400).json({ message: `${row.full_name} does not have a valid email address.` });
  }

  let idToken = row.id_token;
  if (!idToken) {
    idToken = newIdToken();
    await pool.query('UPDATE delegates SET id_token = ? WHERE id = ?', [idToken, row.id]);
  }

  const now = new Date();
  try {
    const { attachments, variables } = await buildDelegateIdEmail({ fullName: row.full_name, formLink: `${EVENT.url}delegate-id/${idToken}` });
    await sendTemplateEmail('delegate_id_request', row.email, variables, { attachments });
  } catch (error) {
    await pool.query('UPDATE delegates SET id_request_last_attempt_at = ?, id_request_last_error = ? WHERE id = ?', [now, String(error.message || error).slice(0, 1000), row.id]);
    const [[failed]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.id = ?`, [row.id]);
    return res.status(502).json({ message: `Email to ${row.email} could not be sent: ${error.message}`, delegate: toDelegateRow(failed) });
  }

  await pool.query(
    'UPDATE delegates SET id_request_sent_at = ?, id_request_last_attempt_at = ?, id_request_last_error = NULL, id_request_send_count = id_request_send_count + 1 WHERE id = ?',
    [now, now, row.id]
  );
  const [[updated]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.id = ?`, [row.id]);
  res.json({ delegate: toDelegateRow(updated) });
});

const reviewId = asyncHandler(async (req, res) => {
  const status = String(req.body?.status || '');
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (!REVIEW_STATUSES.includes(status)) return res.status(400).json({ message: 'Choose verified or rejected.' });
  if (status === 'rejected' && !reason) return res.status(400).json({ message: 'Please give a reason for rejecting this ID.' });

  const [result] = await pool.query(
    'UPDATE delegate_ids SET status = ?, rejection_reason = ?, reviewed_by = ?, reviewed_at = ? WHERE delegate_id = ?',
    [status, status === 'rejected' ? reason : null, req.user?.id || null, new Date(), req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ message: 'This delegate has not submitted an ID.' });
  await logAccess(req.params.id, req.user?.id, status);
  const [[row]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.id = ?`, [req.params.id]);
  res.json({ delegate: toDelegateRow(row) });
});

// The image is streamed through this route rather than linked: Cloudinary's signed delivery URLs do not expire.
const getIdDocument = asyncHandler(async (req, res) => {
  const delegateId = Number(req.params.id);
  // Door staff can only open the ID of the person they have just scanned, never browse them by number.
  if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user?.role)) {
    const since = new Date(Date.now() - SCAN_ACCESS_MINUTES * 60 * 1000);
    const [[scan]] = await pool.query(
      "SELECT id FROM delegate_id_access_log WHERE delegate_id = ? AND user_id = ? AND action = 'scan' AND created_at >= ? LIMIT 1",
      [delegateId, req.user?.id, since]
    );
    if (!scan) return res.status(403).json({ message: 'Scan this delegate\'s QR code to view their ID.' });
  }

  const [[row]] = await pool.query('SELECT image_public_id FROM delegate_ids WHERE delegate_id = ?', [delegateId]);
  if (!row) return res.status(404).json({ message: 'No ID on file for this delegate.' });

  const url = cloudinary.utils.private_download_url(row.image_public_id, 'jpg', {
    resource_type: 'image',
    type: 'authenticated',
    expires_at: Math.floor(Date.now() / 1000) + 60,
  });
  const response = await fetch(url);
  if (!response.ok) return res.status(502).json({ message: 'The ID image could not be loaded. Please try again.' });

  await logAccess(delegateId, req.user?.id, 'view');
  res.set({ 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store' });
  res.send(Buffer.from(await response.arrayBuffer()));
});

// Scanner step 1: show who this is and their ID. Attendance is only marked when staff confirm (POST /check-in).
const previewCheckIn = asyncHandler(async (req, res) => {
  const code = String(req.body?.code || '').trim();
  if (!code) return res.status(400).json({ message: 'No QR code was provided.' });
  const [[row]] = await pool.query(`${DELEGATE_WITH_ID} WHERE d.checkin_token = ? LIMIT 1`, [code]);
  if (!row) return res.status(404).json({ message: 'This QR code does not belong to any registered delegate.' });
  await logAccess(row.id, req.user?.id, 'scan');
  const submission = row.id_status ? toIdSummary(row) : null;
  res.json({
    delegate: {
      id: row.id,
      code,
      fullName: row.full_name,
      registrationId: row.registration_id,
      isPresent: Boolean(row.is_present),
      attendedAt: row.attended_at,
      idCheck: submission && {
        status: submission.status,
        idTypeLabel: submission.idTypeLabel,
        nameOnId: submission.nameOnId,
        numberLast4: submission.numberLast4,
      },
    },
  });
});

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
// Names come from a public form: a leading = + - @ would run as a formula when the venue opens the file.
const csvText = (value) => csvCell(/^[=+\-@\t\r]/.test(String(value ?? '')) ? `'${value}` : value);
// Written as a text formula so Excel keeps every digit (plain numbers are how 9.18E+11 phones happened).
const csvExact = (value) => csvCell(`="${String(value ?? '').replace(/"/g, '')}"`);

const buildVenueCsv = (rows) => {
  const headers = ['S. No.', 'Registration ID', 'Name as on ID', 'Registered Name', 'Phone', 'Email', 'ID Type', 'ID Number', 'Verification Status'];
  const lines = rows.map((row, index) => [
    index + 1,
    csvText(row.registration_id),
    csvText(row.name_on_id),
    csvText(row.full_name),
    csvExact(row.id_phone),
    csvText(row.email),
    csvText(ID_TYPES[row.id_type]?.label || row.id_type),
    csvExact(row.id_type === 'aadhaar_masked' ? `XXXX XXXX ${decryptIdNumber(row.id_number_enc)}` : decryptIdNumber(row.id_number_enc)),
    csvText(row.id_status),
  ].join(','));
  // The byte-order mark makes Excel read names with non-English characters correctly.
  return `﻿${[headers.join(','), ...lines].join('\r\n')}`;
};

const exportVenueList = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`${DELEGATE_WITH_ID} WHERE i.status IN ('pending', 'verified') ORDER BY d.id ASC`);
  await logAccess(null, req.user?.id, 'export');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="GHC_Venue_ID_List.csv"', 'Cache-Control': 'private, no-store' });
  res.send(buildVenueCsv(rows));
});

module.exports = {
  buildVenueCsv,
  exportVenueList,
  getIdDocument,
  getIdForm,
  listDelegateIds,
  parseIdSubmission,
  previewCheckIn,
  reviewId,
  sendIdRequest,
  submitIdForm,
};
