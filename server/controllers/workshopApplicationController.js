const asyncHandler = require('../utils/asyncHandler');
const { pool } = require('../config/db');
const Workshop = require('../models/workshopModel');
const WorkshopApplication = require('../models/workshopApplicationModel');
const { sendTemplateEmail } = require('../services/mailService');

const writeAudit = async (req, action, recordId, oldValues = null, newValues = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user?.id || null,
        action,
        'workshops',
        'workshop_application',
        String(recordId),
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip || req.socket?.remoteAddress || null,
        req.headers?.['user-agent'] || null,
      ]
    );
  } catch (error) {
    console.warn('Failed to write workshop audit log:', error.message);
  }
};

/**
 * Public: Submit a workshop application
 */
const publicApply = asyncHandler(async (req, res) => {
  const {
    workshopId,
    fullName,
    email,
    mobile,
    whatsapp,
    country,
    state,
    city,
    institution,
    designation,
    academicLevel,
    ghcRegistrationId,
  } = req.body;

  // 1. Validate required fields
  if (!workshopId || !fullName || !email || !mobile || !country || !state || !city || !institution || !designation || !academicLevel) {
    return res.status(400).json({
      message: 'All personal, academic and location fields are required.',
    });
  }

  // 2. Validate email and mobile
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  const cleanPhone = String(mobile).replace(/[^0-9+]/g, '').trim();
  if (cleanPhone.length < 8 || cleanPhone.length > 20) {
    return res.status(400).json({ message: 'Please provide a valid mobile number (8 to 20 digits).' });
  }

  // 3. Check workshop existence and registration state
  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    return res.status(404).json({ message: 'Workshop not found.' });
  }

  if (workshop.status !== 'published') {
    return res.status(400).json({ message: 'This workshop is not published or accepting applications.' });
  }

  if (workshop.isRegistrationOpen === false) {
    return res.status(400).json({ message: 'Applications for this workshop are currently closed.' });
  }

  // 4. Duplicate Application Protection (Requirement 23)
  const existingApp = await WorkshopApplication.findByWorkshopAndContact(workshopId, email, mobile);
  if (existingApp) {
    return res.status(409).json({
      message: `You have already applied for this workshop (Application ID: ${existingApp.application_id || existingApp.applicationId}). Please check your registered email for your application details.`,
      applicationId: existingApp.application_id || existingApp.applicationId,
    });
  }

  // 5. Create Application
  const application = await WorkshopApplication.create({
    workshopId,
    fullName,
    email,
    mobile: cleanPhone,
    whatsapp: whatsapp ? String(whatsapp).replace(/[^0-9+]/g, '').trim() : cleanPhone,
    country,
    state,
    city,
    institution,
    designation,
    academicLevel,
    ghcRegistrationId: ghcRegistrationId ? String(ghcRegistrationId).trim().toUpperCase() : null,
  });

  // 6. Write Audit Log
  await writeAudit(req, 'WORKSHOP_APPLICATION_SUBMITTED', application.id, null, {
    applicationId: application.applicationId,
    workshopId: application.workshopId,
    fullName: application.fullName,
    ghcPassStatus: application.ghcPassStatus,
  });

  // 7. Send "workshop_application_received" email (graceful error handling)
  try {
    await sendTemplateEmail(
      'workshop_application_received',
      application.email,
      {
        fullName: application.fullName,
        applicationId: application.applicationId,
        workshopName: application.workshopTitle,
        workshopVenue: application.workshopVenue || 'New Delhi',
      }
    );
  } catch (emailErr) {
    console.warn('Workshop application received email dispatch warning:', emailErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Congratulations! Your workshop application has been submitted successfully.',
    application: {
      id: application.id,
      applicationId: application.applicationId,
      workshopTitle: application.workshopTitle,
      fullName: application.fullName,
      email: application.email,
      applicationStatus: application.applicationStatus,
      ghcPassStatus: application.ghcPassStatus,
      createdAt: application.createdAt,
    },
  });
});

/**
 * Public: Check application status safely
 */
const publicGetApplicationStatus = asyncHandler(async (req, res) => {
  const applicationId = req.query.applicationId || req.query.reference || req.query.id;
  const { email, mobile } = req.query;
  if (!applicationId) {
    return res.status(400).json({ message: 'Application ID or reference is required.' });
  }

  const application = await WorkshopApplication.findByApplicationId(String(applicationId).trim().toUpperCase());
  if (!application) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }

  // Verify identity using email or mobile to prevent enumeration
  const matchEmail = email && application.email.toLowerCase() === String(email).trim().toLowerCase();
  const matchMobile = mobile && application.mobile.slice(-10) === String(mobile).replace(/[^0-9]/g, '').slice(-10);

  if (!matchEmail && !matchMobile) {
    return res.status(403).json({ message: 'Verification failed. Please provide the registered email or mobile number.' });
  }

  res.json({
    applicationId: application.applicationId,
    workshopTitle: application.workshopTitle,
    workshopDate: application.workshopDate,
    workshopVenue: application.workshopVenue,
    fullName: application.fullName,
    applicationStatus: application.applicationStatus,
    workshopRegistrationId: application.workshopRegistrationId,
    createdAt: application.createdAt,
  });
});

/**
 * Workshop Team / Admin: Dashboard Stats
 */
const getDashboardStats = asyncHandler(async (_req, res) => {
  const stats = await WorkshopApplication.getStats();
  res.json({ stats });
});

/**
 * Workshop Team / Admin: List Applications
 */
const listApplications = asyncHandler(async (req, res) => {
  const {
    workshopId,
    applicationStatus,
    ghcPassStatus,
    search,
    date,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const offset = (pageNum - 1) * limitNum;

  const result = await WorkshopApplication.list({
    workshopId,
    applicationStatus,
    ghcPassStatus,
    search,
    date,
    limit: limitNum,
    offset,
    sortBy,
    sortOrder,
  });

  res.json({
    applications: result.applications,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(result.total / limitNum) || 1,
  });
});

/**
 * Workshop Team / Admin: Get Application Detail
 */
const getApplication = asyncHandler(async (req, res) => {
  const application = await WorkshopApplication.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }
  res.json({ application });
});

/**
 * Workshop Team / Admin: Verify GHC Pass
 */
const verifyGhcPass = asyncHandler(async (req, res) => {
  const { manualStatus, ghcRegistrationId, notes } = req.body;
  const reviewerId = req.user?.id || null;
  const reviewerName = req.user?.name || req.user?.email || 'Workshop Admin';

  const before = await WorkshopApplication.findById(req.params.id);
  if (!before) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }

  const updated = await WorkshopApplication.verifyGhcPass(req.params.id, {
    manualStatus,
    ghcRegistrationId,
    notes,
    reviewerId,
    reviewerName,
  });

  await writeAudit(
    req,
    'WORKSHOP_APPLICATION_GHC_VERIFIED',
    req.params.id,
    { ghcPassStatus: before.ghcPassStatus, ghcRegistrationId: before.ghcRegistrationId },
    { ghcPassStatus: updated.ghcPassStatus, ghcRegistrationId: updated.ghcRegistrationId, reviewerName }
  );

  res.json({
    success: true,
    message: updated.ghcPassStatus === 'VERIFIED'
      ? 'GHC Pass verified successfully.'
      : 'GHC Pass verification updated (Not Found / Pending).',
    application: updated,
  });
});

/**
 * Workshop Team / Admin: Confirm Application
 */
const confirmApplication = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const reviewerId = req.user?.id || null;
  const reviewerName = req.user?.name || req.user?.email || 'Workshop Admin';

  const before = await WorkshopApplication.findById(req.params.id);
  if (!before) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }

  const updated = await WorkshopApplication.confirmApplication(req.params.id, {
    reviewerId,
    reviewerName,
    notes,
  });

  await writeAudit(
    req,
    'WORKSHOP_APPLICATION_CONFIRMED',
    req.params.id,
    { applicationStatus: before.applicationStatus },
    {
      applicationStatus: updated.applicationStatus,
      workshopRegistrationId: updated.workshopRegistrationId,
      reviewerName,
    }
  );

  // Send Confirmation Email (Requirement 19 & 20: Email failure must NOT roll back confirmation)
  let emailDelivered = false;
  let emailError = null;

  try {
    await sendTemplateEmail(
      'workshop_registration_confirmation',
      updated.email,
      {
        fullName: updated.fullName,
        workshopName: updated.workshopTitle,
        workshopDate: updated.workshopDuration || updated.workshopDate || '22nd & 23rd September 2026',
        workshopVenue: updated.workshopVenue || 'New Delhi',
        workshopOrganizer: updated.workshopOrganizer || 'New Delhi',
        registrationId: updated.workshopRegistrationId,
      }
    );
    emailDelivered = true;
  } catch (err) {
    console.warn('Workshop confirmation email failed:', err.message);
    emailError = err.message || String(err);
  }

  res.json({
    success: true,
    message: emailDelivered
      ? 'Workshop application confirmed and confirmation email sent.'
      : 'Workshop application confirmed. (Email sending failed, but can be resent from the dashboard).',
    emailDelivered,
    emailError,
    application: updated,
  });
});

/**
 * Workshop Team / Admin: Reject Application
 */
const rejectApplication = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const reviewerId = req.user?.id || null;
  const reviewerName = req.user?.name || req.user?.email || 'Workshop Admin';

  const before = await WorkshopApplication.findById(req.params.id);
  if (!before) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }

  const updated = await WorkshopApplication.rejectApplication(req.params.id, {
    reviewerId,
    reviewerName,
    notes,
  });

  await writeAudit(
    req,
    'WORKSHOP_APPLICATION_REJECTED',
    req.params.id,
    { applicationStatus: before.applicationStatus },
    { applicationStatus: 'REJECTED', reviewerName, notes }
  );

  res.json({
    success: true,
    message: 'Workshop application rejected.',
    application: updated,
  });
});

/**
 * Workshop Team / Admin: Resend Confirmation Email
 */
const resendConfirmationEmail = asyncHandler(async (req, res) => {
  const application = await WorkshopApplication.findById(req.params.id);
  if (!application) {
    return res.status(404).json({ message: 'Workshop application not found.' });
  }

  if (application.applicationStatus !== 'CONFIRMED' || !application.workshopRegistrationId) {
    return res.status(400).json({
      message: 'Confirmation email can only be resent for CONFIRMED applications with a valid Workshop Registration ID.',
    });
  }

  let emailDelivered = false;
  let emailError = null;

  try {
    await sendTemplateEmail(
      'workshop_registration_confirmation',
      application.email,
      {
        fullName: application.fullName,
        workshopName: application.workshopTitle,
        workshopDate: application.workshopDuration || application.workshopDate || '22nd & 23rd September 2026',
        workshopVenue: application.workshopVenue || 'New Delhi',
        workshopOrganizer: application.workshopOrganizer || 'New Delhi',
        registrationId: application.workshopRegistrationId,
      }
    );
    emailDelivered = true;
  } catch (err) {
    emailError = err.message || String(err);
  }

  await writeAudit(req, 'WORKSHOP_CONFIRMATION_EMAIL_RESENT', application.id, null, {
    recipient: application.email,
    registrationId: application.workshopRegistrationId,
    delivered: emailDelivered,
    error: emailError,
  });

  res.json({
    success: true,
    emailDelivered,
    emailError,
    registrationId: application.workshopRegistrationId,
    message: emailDelivered
      ? `Confirmation email resent successfully to ${application.email}.`
      : `Email attempt recorded (${emailError}).`,
  });
});

/**
 * Workshop Team / Admin: Mark Attendance
 */
const markAttendance = asyncHandler(async (req, res) => {
  const { attended, location } = req.body;
  const reviewerId = req.user?.id || null;
  const reviewerName = req.user?.name || req.user?.email || 'Workshop Lead';

  const updated = await WorkshopApplication.markAttendance(req.params.id, {
    attended: attended !== undefined ? Boolean(attended) : true,
    reviewerId,
    reviewerName,
    location: location || 'New Delhi',
  });

  await writeAudit(req, 'WORKSHOP_ATTENDANCE_MARKED', req.params.id, null, {
    attended: updated.attended,
    reviewerName,
  });

  res.json({
    success: true,
    message: updated.attended ? 'Attendance marked successfully.' : 'Attendance revoked.',
    application: updated,
  });
});

/**
 * Workshop Team / Admin: Issue Certificate
 */
const issueCertificate = asyncHandler(async (req, res) => {
  const reviewerId = req.user?.id || null;
  const reviewerName = req.user?.name || req.user?.email || 'Workshop Admin';

  const updated = await WorkshopApplication.issueCertificate(req.params.id, {
    reviewerId,
    reviewerName,
  });

  await writeAudit(req, 'WORKSHOP_CERTIFICATE_ISSUED', req.params.id, null, {
    certificateId: updated.certificateId,
    recipient: updated.fullName,
  });

  res.json({
    success: true,
    message: `Certificate ${updated.certificateId} issued successfully.`,
    certificateNumber: updated.certificateId,
    certificateId: updated.certificateId,
    application: updated,
  });
});

/**
 * Workshop Team / Admin: Reports
 */
const getReports = asyncHandler(async (_req, res) => {
  const reports = await WorkshopApplication.getReports();
  res.json({
    success: true,
    breakdown: reports,
    reports,
  });
});

module.exports = {
  publicApply,
  publicGetApplicationStatus,
  getDashboardStats,
  listApplications,
  getApplication,
  verifyGhcPass,
  confirmApplication,
  rejectApplication,
  resendConfirmationEmail,
  markAttendance,
  issueCertificate,
  getReports,
};
