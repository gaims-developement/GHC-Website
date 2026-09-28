const { pool } = require('../config/db');

const serialize = (row) => {
  if (!row) return null;
  let socialLinks = [];
  try {
    socialLinks = typeof row.social_links === 'string' ? JSON.parse(row.social_links) : (row.social_links || []);
  } catch {
    socialLinks = [];
  }

  let supportingDocuments = [];
  try {
    supportingDocuments = typeof row.supporting_documents === 'string' ? JSON.parse(row.supporting_documents) : (row.supporting_documents || []);
  } catch {
    supportingDocuments = [];
  }

  return {
    id: row.id,
    nominationId: row.nomination_id,
    awardId: row.award_id,
    awardCategory: row.award_category,
    awardKey: row.award_key,
    ageCategory: row.age_category,
    fullName: row.full_name,
    dob: row.dob ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob).slice(0, 10)) : null,
    age: row.age,
    sex: row.sex,
    medicalCollege: row.medical_college,
    organisation: row.organisation,
    designation: row.designation,
    email: row.email,
    mobile: row.mobile,
    socialLinks,
    nominationStatement: row.nomination_statement,
    photoUrl: row.photo_url,
    photoCloudinaryId: row.photo_cloudinary_id,
    cvUrl: row.cv_url,
    cvCloudinaryId: row.cv_cloudinary_id,
    supportingDocuments,
    paymentId: row.payment_id || null,
    paymentStatus: row.payment_status || 'PAYMENT_ID_SUBMITTED',
    paymentProvider: row.payment_provider || 'CLIRNET',
    paymentAmount: row.payment_amount != null ? Number(row.payment_amount) : 5000,
    paymentSubmittedAt: row.payment_submitted_at,
    paymentVerifiedAt: row.payment_verified_at,
    draftId: row.draft_id || null,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at,
    decisionNotes: row.decision_notes,
    eventId: row.event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const generateNominationId = async () => {
  let unique = false;
  let nominationId = '';
  let attempts = 0;

  while (!unique && attempts < 10) {
    attempts++;
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    nominationId = `GHC-NOM-${randomNum}`;
    const [existing] = await pool.query('SELECT id FROM award_nominations WHERE nomination_id = ? LIMIT 1', [nominationId]);
    if (existing.length === 0) {
      unique = true;
    }
  }

  return nominationId || `GHC-NOM-${Date.now().toString().slice(-6)}`;
};

const findByPaymentId = async (paymentId) => {
  if (!paymentId || !String(paymentId).trim()) return null;
  const normalized = String(paymentId).trim();
  const [rows] = await pool.query(
    'SELECT * FROM award_nominations WHERE payment_id = ? LIMIT 1',
    [normalized]
  );
  return rows[0] ? serialize(rows[0]) : null;
};

const findByDraftId = async (draftId) => {
  if (!draftId || !String(draftId).trim()) return null;
  const [rows] = await pool.query(
    'SELECT * FROM award_nominations WHERE draft_id = ? LIMIT 1',
    [String(draftId).trim()]
  );
  return rows[0] ? serialize(rows[0]) : null;
};

const saveDraft = async ({ draftId, email = null, fullName = null, awardId = null, draftData }) => {
  if (!draftId) return null;
  const dataJson = JSON.stringify(draftData || {});
  await pool.query(
    `INSERT INTO nomination_drafts (draft_id, email, full_name, award_id, draft_data)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       email = VALUES(email),
       full_name = VALUES(full_name),
       award_id = VALUES(award_id),
       draft_data = VALUES(draft_data),
       updated_at = CURRENT_TIMESTAMP`,
    [draftId, email, fullName, awardId, dataJson]
  );
  return { draftId, email, fullName, awardId, draftData };
};

const getDraft = async (draftId) => {
  if (!draftId) return null;
  const [rows] = await pool.query(
    'SELECT * FROM nomination_drafts WHERE draft_id = ? LIMIT 1',
    [draftId]
  );
  if (!rows[0]) return null;
  let parsed = {};
  try {
    parsed = typeof rows[0].draft_data === 'string' ? JSON.parse(rows[0].draft_data) : rows[0].draft_data;
  } catch {
    parsed = {};
  }
  return {
    draftId: rows[0].draft_id,
    email: rows[0].email,
    fullName: rows[0].full_name,
    awardId: rows[0].award_id,
    draftData: parsed,
    updatedAt: rows[0].updated_at,
  };
};

const create = async (data) => {
  const nominationId = data.nominationId || (await generateNominationId());
  const socialLinksJson = JSON.stringify(data.socialLinks || []);
  const supportingDocsJson = JSON.stringify(data.supportingDocuments || []);

  const [result] = await pool.query(
    `INSERT INTO award_nominations (
      nomination_id, award_id, award_category, award_key, age_category,
      full_name, dob, age, sex, medical_college, organisation,
      designation, email, mobile, social_links, nomination_statement,
      photo_url, photo_cloudinary_id, cv_url, cv_cloudinary_id,
      supporting_documents, payment_id, payment_status, payment_provider,
      payment_amount, payment_submitted_at, draft_id, status, event_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nominationId,
      data.awardId || null,
      data.awardCategory,
      data.awardKey || null,
      data.ageCategory || null,
      data.fullName,
      data.dob || null,
      data.age || null,
      data.sex || null,
      data.medicalCollege || null,
      data.organisation,
      data.designation,
      data.email,
      data.mobile,
      socialLinksJson,
      data.nominationStatement || null,
      data.photoUrl || null,
      data.photoCloudinaryId || null,
      data.cvUrl || null,
      data.cvCloudinaryId || null,
      supportingDocsJson,
      data.paymentId ? String(data.paymentId).trim() : null,
      data.paymentStatus || 'PAYMENT_ID_SUBMITTED',
      data.paymentProvider || 'CLIRNET',
      data.paymentAmount != null ? Number(data.paymentAmount) : 5000.00,
      data.paymentSubmittedAt || (data.paymentId ? new Date() : null),
      data.draftId || null,
      data.status || 'PENDING',
      data.eventId || null,
    ]
  );

  return findById(result.insertId);
};

const findById = async (id) => {
  const isNumeric = !Number.isNaN(Number(id));
  const query = isNumeric
    ? 'SELECT * FROM award_nominations WHERE id = ? LIMIT 1'
    : 'SELECT * FROM award_nominations WHERE nomination_id = ? LIMIT 1';

  const [rows] = await pool.query(query, [id]);
  return rows[0] ? serialize(rows[0]) : null;
};

const list = async ({
  search = '',
  awardCategory = '',
  status = '',
  paymentStatus = '',
  limit = 50,
  offset = 0,
  sortBy = 'created_at',
  sortOrder = 'DESC',
} = {}) => {
  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    const term = `%${search.trim()}%`;
    conditions.push(`(
      full_name LIKE ? OR
      award_category LIKE ? OR
      organisation LIKE ? OR
      medical_college LIKE ? OR
      designation LIKE ? OR
      nomination_id LIKE ? OR
      payment_id LIKE ? OR
      email LIKE ?
    )`);
    params.push(term, term, term, term, term, term, term, term);
  }

  if (awardCategory && awardCategory.toUpperCase() !== 'ALL') {
    conditions.push('(award_category = ? OR award_key = ?)');
    params.push(awardCategory, awardCategory);
  }

  if (status && status.toUpperCase() !== 'ALL') {
    conditions.push('status = ?');
    params.push(status.toUpperCase());
  }

  if (paymentStatus && paymentStatus.toUpperCase() !== 'ALL') {
    conditions.push('payment_status = ?');
    params.push(paymentStatus.toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const validSortColumns = ['created_at', 'full_name', 'award_category', 'status', 'dob', 'organisation', 'payment_status', 'payment_submitted_at'];
  const sanitizedSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
  const sanitizedSortOrder = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const [[countRow]] = await pool.query(
    `SELECT COUNT(*) AS total FROM award_nominations ${whereClause}`,
    params
  );
  const total = Number(countRow?.total || 0);

  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 200));
  const safeOffset = Math.max(0, Number(offset) || 0);

  const [rows] = await pool.query(
    `SELECT * FROM award_nominations ${whereClause} ORDER BY ${sanitizedSortBy} ${sanitizedSortOrder} LIMIT ? OFFSET ?`,
    [...params, safeLimit, safeOffset]
  );

  return {
    nominations: rows.map(serialize),
    total,
    limit: safeLimit,
    offset: safeOffset,
  };
};

const getStats = async () => {
  const [[row]] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(status = 'PENDING'), 0) AS pending,
      COALESCE(SUM(status = 'ACCEPTED'), 0) AS accepted,
      COALESCE(SUM(status = 'REJECTED'), 0) AS rejected
    FROM award_nominations
  `);

  return {
    total: Number(row?.total || 0),
    pending: Number(row?.pending || 0),
    accepted: Number(row?.accepted || 0),
    rejected: Number(row?.rejected || 0),
  };
};

const updateDecision = async (id, { status, reviewedBy, reviewerName, decisionNotes = null }) => {
  await pool.query(
    `UPDATE award_nominations
     SET status = ?, reviewed_by = ?, reviewer_name = ?, reviewed_at = NOW(), decision_notes = ?
     WHERE id = ?`,
    [status, reviewedBy, reviewerName, decisionNotes, id]
  );

  return findById(id);
};

module.exports = {
  create,
  findById,
  findByPaymentId,
  findByDraftId,
  generateNominationId,
  getDraft,
  getStats,
  list,
  saveDraft,
  serialize,
  updateDecision,
};
