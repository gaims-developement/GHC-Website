const { pool } = require('../config/db');

const normalize = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    applicationId: row.application_id,
    workshopId: row.workshop_id,
    workshopTitle: row.workshop_title || row.title,
    workshopVenue: row.workshop_venue || row.venue,
    workshopDate: row.workshop_date || row.date,
    workshopDuration: row.workshop_duration || row.duration,
    workshopOrganizer: row.workshop_organizer || row.organizer || row.faculty,
    workshopCapacity: Number(row.workshop_capacity || row.capacity || 0),
    workshopRegisteredCount: Number(row.workshop_registered_count || row.registered_count || 0),
    workshopCertificateAvailable: Boolean(row.certificate_available),
    
    // Applicant Information
    fullName: row.full_name,
    email: row.email,
    mobile: row.mobile,
    whatsapp: row.whatsapp || row.mobile,
    country: row.country,
    state: row.state,
    city: row.city,
    institution: row.institution,
    designation: row.designation,
    academicLevel: row.academic_level,

    // Statuses
    applicationStatus: row.application_status,
    ghcPassStatus: row.ghc_pass_status,
    ghcRegistrationId: row.ghc_registration_id,
    ghcVerificationResult: row.ghc_verification_result,
    ghcVerifiedAt: row.ghc_verified_at,

    // Registration ID & Review
    workshopRegistrationId: row.workshop_registration_id,
    confirmedAt: row.confirmed_at,
    reviewedBy: row.reviewed_by,
    reviewerName: row.reviewer_name,
    reviewNotes: row.review_notes,

    // Attendance & Certificate
    attended: Boolean(row.attended),
    attendedAt: row.attended_at,
    certificateId: row.certificate_id,
    certificateIssuedAt: row.certificate_issued_at,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const getWorkshopCode = (title = '') => {
  const clean = String(title).toUpperCase().trim();
  if (clean.includes('BLS') || clean.includes('BASIC LIFE')) return 'BLS';
  if (clean.includes('SUTURING') || clean.includes('LAPAROSCOPIC')) return 'SUT';
  if (clean.includes('LUMBAR') || clean.includes('INJECTION')) return 'LP';
  const letters = clean.replace(/[^A-Z]/g, '').slice(0, 3);
  return letters || 'WS';
};

const nextApplicationId = async (connection = pool) => {
  const [rows] = await connection.query('SELECT COUNT(*) AS total FROM workshop_applications');
  const count = Number(rows[0]?.total || 0) + 1;
  return `GHC-WA-${String(count).padStart(6, '0')}`;
};

const nextWorkshopRegistrationId = async (workshopTitle, connection = pool) => {
  const code = getWorkshopCode(workshopTitle);
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM workshop_applications WHERE workshop_registration_id LIKE ?",
    [`GHC-WS-${code}-%`]
  );
  const count = Number(rows[0]?.total || 0) + 1;
  return `GHC-WS-${code}-${String(count).padStart(6, '0')}`;
};

/**
 * Searches the GHC registrations table for an existing paid / approved delegate pass.
 */
const checkExistingGhcPass = async ({ email, mobile, ghcRegistrationId = null }) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(mobile || '').replace(/[^0-9]/g, '').slice(-10);
  const cleanRegId = ghcRegistrationId ? String(ghcRegistrationId).trim().toUpperCase() : null;

  const clauses = [];
  const params = [];

  if (cleanRegId) {
    clauses.push('registration_id = ?');
    params.push(cleanRegId);
  }
  if (cleanEmail) {
    clauses.push('LOWER(email) = ?');
    params.push(cleanEmail);
  }
  if (cleanPhone && cleanPhone.length >= 8) {
    clauses.push('phone LIKE ?');
    params.push(`%${cleanPhone}%`);
  }

  if (clauses.length === 0) {
    return { isVerified: false, registration: null };
  }

  const [rows] = await pool.query(
    `SELECT id, registration_id, full_name, email, phone, payment_status, registration_status, attendance_status
     FROM registrations
     WHERE ${clauses.join(' OR ')}
     ORDER BY (payment_status = 'paid' OR registration_status = 'approved') DESC, created_at DESC
     LIMIT 1`,
    params
  );

  if (rows.length > 0) {
    const reg = rows[0];
    const isPaid = reg.payment_status === 'paid' || reg.registration_status === 'approved';
    return {
      isVerified: isPaid,
      registration: reg,
      status: isPaid ? 'VERIFIED' : 'PENDING_VERIFICATION',
      details: isPaid
        ? `Found verified GHC Registration: ${reg.registration_id} (${reg.full_name}, Payment: ${reg.payment_status})`
        : `Found GHC Registration: ${reg.registration_id} (${reg.full_name}), but payment is currently ${reg.payment_status || 'pending'}.`,
    };
  }

  return {
    isVerified: false,
    registration: null,
    status: 'PENDING_VERIFICATION',
    details: 'No matching GHC Pass registration record found for provided email or phone.',
  };
};

const create = async (data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const applicationId = await nextApplicationId(connection);

    // Initial GHC Pass verification check
    const ghcCheck = await checkExistingGhcPass({
      email: data.email,
      mobile: data.mobile,
      ghcRegistrationId: data.ghcRegistrationId,
    });

    const ghcPassStatus = ghcCheck.status;
    const ghcRegId = ghcCheck.registration ? ghcCheck.registration.registration_id : (data.ghcRegistrationId || null);
    const ghcVerificationResult = ghcCheck.details;
    const ghcVerifiedAt = ghcCheck.isVerified ? new Date() : null;

    const [result] = await connection.query(
      `INSERT INTO workshop_applications (
        application_id, workshop_id, full_name, email, mobile, whatsapp,
        country, state, city, institution, designation, academic_level,
        application_status, ghc_pass_status, ghc_registration_id,
        ghc_verification_result, ghc_verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, ?)`,
      [
        applicationId,
        data.workshopId,
        data.fullName.trim(),
        data.email.trim().toLowerCase(),
        data.mobile.trim(),
        (data.whatsapp || data.mobile).trim(),
        data.country.trim(),
        data.state.trim(),
        data.city.trim(),
        data.institution.trim(),
        data.designation.trim(),
        data.academicLevel.trim(),
        ghcPassStatus,
        ghcRegId,
        ghcVerificationResult,
        ghcVerifiedAt,
      ]
    );

    await connection.commit();
    return findById(result.insertId);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const findById = async (id) => {
  const [rows] = await pool.query(
    `SELECT wa.*, w.title AS workshop_title, w.venue AS workshop_venue,
            w.date AS workshop_date, w.duration AS workshop_duration,
            w.organizer AS workshop_organizer, w.capacity AS workshop_capacity,
            w.registered_count AS workshop_registered_count,
            w.certificate_available
     FROM workshop_applications wa
     LEFT JOIN workshops w ON w.id = wa.workshop_id
     WHERE wa.id = ? LIMIT 1`,
    [id]
  );
  return normalize(rows[0]);
};

const findByApplicationId = async (applicationId) => {
  const [rows] = await pool.query(
    `SELECT wa.*, w.title AS workshop_title, w.venue AS workshop_venue,
            w.date AS workshop_date, w.duration AS workshop_duration,
            w.organizer AS workshop_organizer, w.capacity AS workshop_capacity,
            w.registered_count AS workshop_registered_count,
            w.certificate_available
     FROM workshop_applications wa
     LEFT JOIN workshops w ON w.id = wa.workshop_id
     WHERE wa.application_id = ? LIMIT 1`,
    [applicationId]
  );
  return normalize(rows[0]);
};

const findByWorkshopAndContact = async (workshopId, email, mobile) => {
  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(mobile || '').trim();
  const [rows] = await pool.query(
    `SELECT id, application_id, application_status, workshop_registration_id, created_at
     FROM workshop_applications
     WHERE workshop_id = ? AND (LOWER(email) = ? OR mobile = ?) AND application_status != 'CANCELLED'
     LIMIT 1`,
    [workshopId, cleanEmail, cleanPhone]
  );
  return rows[0] || null;
};

const list = async ({
  workshopId = '',
  applicationStatus = '',
  ghcPassStatus = '',
  search = '',
  date = '',
  limit = 20,
  offset = 0,
  sortBy = 'created_at',
  sortOrder = 'DESC',
} = {}) => {
  const whereClauses = [];
  const params = [];

  if (workshopId) {
    whereClauses.push('wa.workshop_id = ?');
    params.push(Number(workshopId));
  }

  if (applicationStatus) {
    whereClauses.push('wa.application_status = ?');
    params.push(applicationStatus);
  }

  if (ghcPassStatus) {
    whereClauses.push('wa.ghc_pass_status = ?');
    params.push(ghcPassStatus);
  }

  if (search) {
    whereClauses.push(
      '(wa.full_name LIKE ? OR wa.email LIKE ? OR wa.mobile LIKE ? OR wa.institution LIKE ? OR wa.application_id LIKE ? OR wa.workshop_registration_id LIKE ?)'
    );
    const term = `%${search}%`;
    params.push(term, term, term, term, term, term);
  }

  if (date) {
    whereClauses.push('DATE(wa.created_at) = ?');
    params.push(date);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const safeSortFields = {
    created_at: 'wa.created_at',
    full_name: 'wa.full_name',
    application_id: 'wa.application_id',
    application_status: 'wa.application_status',
    ghc_pass_status: 'wa.ghc_pass_status',
  };
  const orderField = safeSortFields[sortBy] || 'wa.created_at';
  const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM workshop_applications wa ${whereSql}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const [rows] = await pool.query(
    `SELECT wa.*, w.title AS workshop_title, w.venue AS workshop_venue,
            w.date AS workshop_date, w.duration AS workshop_duration,
            w.organizer AS workshop_organizer, w.capacity AS workshop_capacity,
            w.registered_count AS workshop_registered_count,
            w.certificate_available
     FROM workshop_applications wa
     LEFT JOIN workshops w ON w.id = wa.workshop_id
     ${whereSql}
     ORDER BY ${orderField} ${orderDirection}
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );

  return {
    applications: rows.map(normalize),
    total,
  };
};

const getStats = async () => {
  const [[wStats]] = await pool.query(`
    SELECT
      COUNT(*) AS totalWorkshops,
      SUM(status = 'published' AND is_registration_open = TRUE) AS openWorkshops,
      SUM(capacity) AS totalCapacity,
      SUM(registered_count) AS totalConfirmedSeats
    FROM workshops
  `);

  const [[appStats]] = await pool.query(`
    SELECT
      COUNT(*) AS totalApplications,
      SUM(application_status IN ('SUBMITTED', 'UNDER_REVIEW')) AS underReview,
      SUM(ghc_pass_status = 'VERIFIED') AS ghcPassVerified,
      SUM(application_status = 'CONFIRMED') AS confirmed,
      SUM(ghc_pass_status != 'VERIFIED' AND application_status != 'REJECTED') AS pendingGhcPass
    FROM workshop_applications
  `);

  const totalCap = Number(wStats.totalCapacity || 0);
  const confirmedSeats = Number(wStats.totalConfirmedSeats || appStats.confirmed || 0);
  const availableSeats = Math.max(0, totalCap - confirmedSeats);

  return {
    totalWorkshops: Number(wStats.totalWorkshops || 0),
    openWorkshops: Number(wStats.openWorkshops || 0),
    totalApplications: Number(appStats.totalApplications || 0),
    underReview: Number(appStats.underReview || 0),
    ghcPassVerified: Number(appStats.ghcPassVerified || 0),
    confirmed: Number(appStats.confirmed || 0),
    pendingGhcPass: Number(appStats.pendingGhcPass || 0),
    availableSeats,
    totalCapacity: totalCap,
  };
};

const verifyGhcPass = async (id, { manualStatus = null, ghcRegistrationId = null, notes = null, reviewerId = null, reviewerName = null } = {}) => {
  const application = await findById(id);
  if (!application) {
    const error = new Error('Workshop application not found.');
    error.statusCode = 404;
    throw error;
  }

  let finalStatus = manualStatus;
  let finalRegId = ghcRegistrationId || application.ghcRegistrationId;
  let finalDetails = notes || '';

  if (!manualStatus) {
    const check = await checkExistingGhcPass({
      email: application.email,
      mobile: application.mobile,
      ghcRegistrationId: finalRegId,
    });
    finalStatus = check.status;
    if (check.registration) finalRegId = check.registration.registration_id;
    finalDetails = check.details;
  }

  const verifiedAt = finalStatus === 'VERIFIED' ? new Date() : null;

  await pool.query(
    `UPDATE workshop_applications SET
      ghc_pass_status = ?,
      ghc_registration_id = COALESCE(?, ghc_registration_id),
      ghc_verification_result = ?,
      ghc_verified_at = COALESCE(?, ghc_verified_at),
      application_status = CASE
        WHEN application_status = 'SUBMITTED' THEN 'UNDER_REVIEW'
        ELSE application_status
      END,
      reviewed_by = COALESCE(?, reviewed_by),
      reviewer_name = COALESCE(?, reviewer_name)
     WHERE id = ?`,
    [
      finalStatus,
      finalRegId,
      finalDetails,
      verifiedAt,
      reviewerId,
      reviewerName,
      id,
    ]
  );

  return findById(id);
};

const confirmApplication = async (id, { reviewerId = null, reviewerName = 'Workshop Admin', notes = null } = {}) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[appRow]] = await connection.query(
      'SELECT wa.*, w.title AS workshop_title, w.capacity, w.registered_count FROM workshop_applications wa JOIN workshops w ON w.id = wa.workshop_id WHERE wa.id = ? FOR UPDATE',
      [id]
    );

    if (!appRow) {
      const error = new Error('Application not found.');
      error.statusCode = 404;
      throw error;
    }

    if (appRow.application_status === 'CONFIRMED' && appRow.workshop_registration_id) {
      await connection.rollback();
      return findById(id);
    }

    // Atomic Capacity Check
    const [[countRow]] = await connection.query(
      "SELECT COUNT(*) AS total FROM workshop_applications WHERE workshop_id = ? AND application_status = 'CONFIRMED'",
      [appRow.workshop_id]
    );

    const currentConfirmed = Number(countRow?.total || 0);
    const capacity = Number(appRow.capacity || 0);

    if (capacity > 0 && currentConfirmed >= capacity) {
      const error = new Error(`Cannot confirm application. Workshop capacity of ${capacity} seats has already been reached.`);
      error.statusCode = 400;
      throw error;
    }

    const registrationId = await nextWorkshopRegistrationId(appRow.workshop_title, connection);

    await connection.query(
      `UPDATE workshop_applications SET
        application_status = 'CONFIRMED',
        ghc_pass_status = 'VERIFIED',
        workshop_registration_id = ?,
        confirmed_at = NOW(),
        reviewed_by = ?,
        reviewer_name = ?,
        review_notes = COALESCE(?, review_notes)
       WHERE id = ?`,
      [registrationId, reviewerId, reviewerName, notes, id]
    );

    await connection.query(
      'UPDATE workshops SET registered_count = registered_count + 1 WHERE id = ?',
      [appRow.workshop_id]
    );

    // Sync with workshop_registrations table if present
    await connection.query(
      'INSERT INTO workshop_registrations (workshop_id, status) VALUES (?, "confirmed")',
      [appRow.workshop_id]
    ).catch(() => {});

    await connection.commit();
    return findById(id);
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

const rejectApplication = async (id, { reviewerId = null, reviewerName = 'Workshop Admin', notes = null } = {}) => {
  const application = await findById(id);
  if (!application) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  await pool.query(
    `UPDATE workshop_applications SET
      application_status = 'REJECTED',
      reviewed_by = ?,
      reviewer_name = ?,
      review_notes = ?
     WHERE id = ?`,
    [reviewerId, reviewerName, notes || 'Application rejected by Workshop Committee.', id]
  );

  return findById(id);
};

const markAttendance = async (id, { attended = true, reviewerId = null, reviewerName = 'Workshop Lead', location = 'New Delhi' } = {}) => {
  const application = await findById(id);
  if (!application) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  const willBeAttended = Boolean(attended);
  await pool.query(
    `UPDATE workshop_applications SET
      attended = ?,
      attended_at = CASE WHEN ? THEN NOW() ELSE NULL END
     WHERE id = ?`,
    [willBeAttended, willBeAttended, id]
  );

  if (willBeAttended) {
    await pool.query(
      `INSERT INTO attendance_logs (workshop_id, checkin_time, checked_by, location)
       VALUES (?, NOW(), ?, ?)`,
      [application.workshopId, reviewerName, location]
    ).catch(() => {});
  }

  return findById(id);
};

const issueCertificate = async (id, { reviewerId = null, reviewerName = 'Workshop Admin' } = {}) => {
  const application = await findById(id);
  if (!application) {
    const error = new Error('Application not found.');
    error.statusCode = 404;
    throw error;
  }

  if (application.applicationStatus !== 'CONFIRMED' || !application.attended) {
    const error = new Error('Certificate can only be issued to CONFIRMED participants who have marked ATTENDANCE.');
    error.statusCode = 400;
    throw error;
  }

  const certificateId = application.certificateId || `GHC-CERT-WS-${String(application.id).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

  await pool.query(
    `UPDATE workshop_applications SET
      certificate_id = ?,
      certificate_issued_at = NOW()
     WHERE id = ?`,
    [certificateId, id]
  );

  await pool.query(
    `INSERT INTO certificates (certificate_id, recipient_name, recipient_email, recipient_type, reference_module, reference_record_id, status)
     VALUES (?, ?, ?, 'WORKSHOP_PARTICIPANT', 'workshops', ?, 'issued')
     ON DUPLICATE KEY UPDATE recipient_name = VALUES(recipient_name), status = 'issued'`,
    [certificateId, application.fullName, application.email, String(application.id)]
  ).catch(() => {});

  return findById(id);
};

const getReports = async () => {
  const [breakdown] = await pool.query(`
    SELECT
      w.id AS workshop_id,
      w.title AS workshop_title,
      w.organizer,
      w.venue,
      w.capacity,
      w.registered_count AS recorded_confirmed,
      COUNT(wa.id) AS total_applications,
      SUM(wa.application_status = 'CONFIRMED') AS confirmed_applications,
      SUM(wa.application_status IN ('SUBMITTED', 'UNDER_REVIEW')) AS pending_applications,
      SUM(wa.application_status = 'REJECTED') AS rejected_applications,
      SUM(wa.ghc_pass_status = 'VERIFIED') AS ghc_verified_count,
      SUM(wa.attended = TRUE) AS attended_count,
      SUM(wa.certificate_id IS NOT NULL) AS certificates_issued
    FROM workshops w
    LEFT JOIN workshop_applications wa ON wa.workshop_id = w.id
    GROUP BY w.id, w.title, w.organizer, w.venue, w.capacity, w.registered_count
    ORDER BY w.display_order ASC, w.id ASC
  `);

  return breakdown.map((item) => {
    const capacity = Number(item.capacity || 0);
    const confirmed = Number(item.confirmed_applications || 0);
    const utilization = capacity > 0 ? Math.min(100, Math.round((confirmed / capacity) * 100)) : 0;
    const attended = Number(item.attended_count || 0);
    const attendanceRate = confirmed > 0 ? Math.min(100, Math.round((attended / confirmed) * 100)) : 0;

    return {
      workshopId: item.workshop_id,
      workshopTitle: item.workshop_title,
      organizer: item.organizer,
      venue: item.venue,
      capacity,
      totalApplications: Number(item.total_applications || 0),
      confirmedApplications: confirmed,
      pendingApplications: Number(item.pending_applications || 0),
      rejectedApplications: Number(item.rejected_applications || 0),
      ghcVerifiedCount: Number(item.ghc_verified_count || 0),
      attendedCount: attended,
      certificatesIssued: Number(item.certificates_issued || 0),
      utilizationPercentage: utilization,
      attendanceRatePercentage: attendanceRate,
    };
  });
};

module.exports = {
  create,
  findById,
  findByApplicationId,
  findByWorkshopAndContact,
  list,
  getStats,
  checkExistingGhcPass,
  verifyGhcPass,
  confirmApplication,
  rejectApplication,
  markAttendance,
  issueCertificate,
  getReports,
};
