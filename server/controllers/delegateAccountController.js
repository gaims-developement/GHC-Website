const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { getJwtSecret, signResource, verifyResourceSignature } = require('../config/jwt');
const asyncHandler = require('../utils/asyncHandler');
const { sendTemplateEmail } = require('../services/mailService');
const Workshop = require('../models/workshopModel');
const { getWorkshopCode } = require('../models/workshopApplicationModel');
const { certificatePdf } = require('./certificateController');
const { escapeHtml, newCheckinToken } = require('./delegateController');

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_SECONDS = 60;
const OTP_SENT_MESSAGE = 'If this Delegate ID is on our list, a login code has been sent to the email you registered with.';
const OTP_FAILED_MESSAGE = 'That code is wrong or has expired. Please check it or request a new one.';

const cleanDelegateId = (value) => String(value || '').trim().toUpperCase().slice(0, 32);
const signOtp = (delegateId, otp) => signResource('delegate-otp', delegateId, otp);

const requestOtp = asyncHandler(async (req, res) => {
  const delegateId = cleanDelegateId(req.body?.delegateId);
  if (!delegateId) return res.status(400).json({ message: 'Please enter your Delegate ID.' });

  const [[row]] = await pool.query('SELECT id, full_name, email FROM delegates WHERE registration_id = ? LIMIT 1', [delegateId]);
  if (row && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email || '')) {
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const now = Date.now();
    // The WHERE clause is the resend cooldown, so repeated requests cannot flood a delegate's inbox.
    const [stored] = await pool.query(
      `UPDATE delegates SET login_otp_hash = ?, login_otp_expires_at = ?, login_otp_attempts = 0, login_otp_sent_at = ?
       WHERE id = ? AND (login_otp_sent_at IS NULL OR login_otp_sent_at < ?)`,
      [signOtp(row.id, otp), new Date(now + OTP_MINUTES * 60000), new Date(now), row.id, new Date(now - OTP_RESEND_SECONDS * 1000)]
    );
    if (stored.affectedRows) {
      try {
        await sendTemplateEmail('delegate_login_otp', row.email, { name: escapeHtml(row.full_name), otp, minutes: OTP_MINUTES });
      } catch {
        await pool.query('UPDATE delegates SET login_otp_hash = NULL, login_otp_sent_at = NULL WHERE id = ?', [row.id]);
        return res.status(502).json({ message: 'We could not send the login code just now. Please try again in a moment.' });
      }
    }
  }
  // The same answer for every ID, so this form cannot be used to check who is on the delegate list.
  res.json({ message: OTP_SENT_MESSAGE, resendSeconds: OTP_RESEND_SECONDS });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const delegateId = cleanDelegateId(req.body?.delegateId);
  const otp = String(req.body?.otp || '').trim();
  const fail = () => res.status(401).json({ message: OTP_FAILED_MESSAGE });
  if (!delegateId || !/^\d{6}$/.test(otp)) return fail();

  const [[row]] = await pool.query('SELECT id, login_otp_hash, login_otp_expires_at FROM delegates WHERE registration_id = ? LIMIT 1', [delegateId]);
  if (!row?.login_otp_hash || new Date(row.login_otp_expires_at).getTime() < Date.now()) return fail();

  // Count the try before comparing, so parallel guesses cannot get past the limit.
  const [attempt] = await pool.query(
    'UPDATE delegates SET login_otp_attempts = login_otp_attempts + 1 WHERE id = ? AND login_otp_hash = ? AND login_otp_attempts < ?',
    [row.id, row.login_otp_hash, OTP_MAX_ATTEMPTS]
  );
  if (!attempt.affectedRows || !verifyResourceSignature(row.login_otp_hash, 'delegate-otp', row.id, otp)) return fail();

  // Each code logs in once: only one request can clear it.
  const [used] = await pool.query('UPDATE delegates SET login_otp_hash = NULL, login_otp_expires_at = NULL WHERE id = ? AND login_otp_hash = ?', [row.id, row.login_otp_hash]);
  if (!used.affectedRows) return fail();

  res.json({ token: jwt.sign({ delegateId: row.id, type: 'delegate' }, getJwtSecret(), { expiresIn: '30d' }) });
});

const getMe = asyncHandler(async (req, res) => {
  const { delegate } = req;
  let checkinToken = delegate.checkin_token;
  if (!checkinToken) {
    checkinToken = newCheckinToken();
    await pool.query('UPDATE delegates SET checkin_token = ? WHERE id = ?', [checkinToken, delegate.id]);
  }
  res.json({ fullName: delegate.full_name, registrationId: delegate.registration_id, email: delegate.email, checkinToken });
});

const listWorkshops = asyncHandler(async (req, res) => {
  const claimedId = req.delegate.claimed_workshop_id;
  res.json({
    workshops: await Workshop.list(),
    claimedWorkshop: claimedId ? (await Workshop.findById(claimedId)) || null : null,
  });
});

const claimWorkshop = asyncHandler(async (req, res) => {
  const workshopId = Number(req.params.id);
  if (!Number.isInteger(workshopId) || workshopId <= 0) return res.status(404).json({ message: 'Workshop not found.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // The row lock makes two taps (or two devices) wait here, so only one claim can ever go through.
    const [[delegate]] = await connection.query('SELECT * FROM delegates WHERE id = ? FOR UPDATE', [req.delegate.id]);
    if (delegate.claimed_workshop_id) {
      await connection.rollback();
      return res.status(409).json({ message: 'You have already chosen your workshop. It cannot be changed.' });
    }

    // Seats are checked and taken in one statement, so the last seat cannot be given out twice.
    const [seat] = await connection.query(
      `UPDATE workshops SET registered_count = registered_count + 1
       WHERE id = ? AND status = 'published' AND is_open_to_all = 0 AND COALESCE(is_enabled, 1) = 1 AND COALESCE(is_registration_open, 1) = 1 AND registered_count < capacity`,
      [workshopId]
    );
    if (!seat.affectedRows) {
      await connection.rollback();
      return res.status(409).json({ message: 'Sorry, this workshop cannot be claimed. It may have just filled up or is no longer open.' });
    }

    const [[workshop]] = await connection.query('SELECT title FROM workshops WHERE id = ?', [workshopId]);
    const suffix = `D${String(delegate.id).padStart(5, '0')}`;
    // Recorded as a confirmed application so the workshop team sees it with their other attendees, attendance and certificates.
    await connection.query(
      `INSERT INTO workshop_applications (
        application_id, workshop_id, full_name, email, mobile, whatsapp, country, state, city, institution, designation, academic_level,
        application_status, ghc_pass_status, ghc_registration_id, ghc_verification_result, ghc_verified_at, workshop_registration_id, confirmed_at, reviewer_name
      ) VALUES (?, ?, ?, ?, ?, ?, '-', '-', ?, ?, 'Delegate', '-', 'CONFIRMED', 'VERIFIED', ?, 'Claimed from the Delegate Dashboard', NOW(), ?, NOW(), 'Delegate Dashboard')`,
      [
        `GHC-WA-${suffix}`,
        workshopId,
        delegate.full_name,
        String(delegate.email || '').trim().toLowerCase(),
        delegate.phone || '-',
        delegate.phone || null,
        delegate.city || '-',
        delegate.institution || '-',
        delegate.registration_id,
        `GHC-WS-${getWorkshopCode(workshop.title)}-${suffix}`,
      ]
    );
    await connection.query("INSERT INTO workshop_registrations (workshop_id, status) VALUES (?, 'confirmed')", [workshopId]);
    await connection.query('UPDATE delegates SET claimed_workshop_id = ?, workshop_claimed_at = NOW() WHERE id = ?', [workshopId, delegate.id]);

    await connection.commit();
    return res.status(201).json({ claimedWorkshop: await Workshop.findById(workshopId) });
  } catch (error) {
    await connection.rollback().catch(() => {});
    // The unique (workshop, email, mobile) key: someone with these details already applied through the public form.
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'An application with your email and phone already exists for this workshop. Please contact secretary@gaims.org.' });
    }
    throw error;
  } finally {
    connection.release();
  }
});

const CERTIFICATE_OWNER = "LOWER(c.recipient_email) = LOWER(?) AND COALESCE(c.status, '') <> 'revoked'";

const listCertificates = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT c.id, c.certificate_id, c.certificate_type, c.recipient_type, c.issue_date, c.created_at, t.name AS template_name
     FROM certificates c LEFT JOIN certificate_templates t ON t.id = c.template_id
     WHERE ${CERTIFICATE_OWNER} ORDER BY c.created_at DESC`,
    [req.delegate.email]
  );
  res.json({
    certificates: rows.map((row) => ({
      id: row.id,
      certificateId: row.certificate_id,
      name: row.template_name || row.certificate_type || row.recipient_type || 'Certificate',
      issuedOn: row.issue_date || row.created_at,
    })),
  });
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const [[certificate]] = await pool.query(
    `SELECT c.*, t.name AS template_name, t.orientation FROM certificates c LEFT JOIN certificate_templates t ON t.id = c.template_id
     WHERE c.id = ? AND ${CERTIFICATE_OWNER} LIMIT 1`,
    [req.params.id, req.delegate.email]
  );
  if (!certificate) return res.status(404).json({ message: 'Certificate not found.' });
  const buffer = await certificatePdf({ certificate, template: { name: certificate.template_name, orientation: certificate.orientation } });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${certificate.certificate_id || certificate.id}.pdf"`);
  res.send(buffer);
});

module.exports = { claimWorkshop, downloadCertificate, getMe, listCertificates, listWorkshops, requestOtp, verifyOtp };
