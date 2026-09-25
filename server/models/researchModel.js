const { pool } = require('../config/db');

const normalize = (item) => item && ({
  id: item.id,
  abstractId: item.abstract_id,
  title: item.title,
  authors: item.authors,
  correspondingAuthor: item.corresponding_author,
  presentingAuthor: item.presenting_author,
  institution: item.institution,
  email: item.email,
  phone: item.phone,
  country: item.country,
  categoryId: item.category_id,
  category: item.category,
  track: item.track,
  keywords: item.keywords,
  abstractText: item.abstract_text,
  pdfUrl: item.file_url || item.pdf_url,
  fileUrl: item.file_url || item.pdf_url,
  declarationUrl: item.declaration_url,
  cityState: item.city_state,
  specialty: item.specialty,
  yearOfStudy: item.year_of_study,
  status: item.submission_status || item.status,
  submissionStatus: item.submission_status || item.status,
  finalScore: item.final_score === null ? null : Number(item.final_score),
  reviewScore: item.review_score === null ? null : Number(item.review_score),
  reviewNotes: item.review_notes,
  reviewerId: item.reviewer_id,
  awardNomination: Boolean(item.award_nomination),
  aiPercentage: item.ai_percentage !== null ? Number(item.ai_percentage) : null,
  plagiarismPercentage: item.plagiarism_percentage !== null ? Number(item.plagiarism_percentage) : null,
  currentVersion: item.current_version || 1,
  revisionToken: item.revision_token,
  revisionTokenExpires: item.revision_token_expires,
  versions: item.versions || [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const list = async ({ includeAll = false, reviewerId = null } = {}) => {
  let where = includeAll ? '' : "WHERE status = 'accepted'";
  const params = [];
  
  if (reviewerId) {
    where = "WHERE reviewer_id = ?";
    params.push(reviewerId);
  }
  
  const [rows] = await pool.query(
    `SELECT * FROM abstracts ${where}
     ORDER BY award_nomination DESC, category ASC, created_at DESC`,
    params
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const isNumeric = !isNaN(Number(id));
  const [rows] = isNumeric
    ? await pool.query('SELECT * FROM abstracts WHERE id = ? OR abstract_id = ? LIMIT 1', [id, String(id)])
    : await pool.query('SELECT * FROM abstracts WHERE abstract_id = ? LIMIT 1', [String(id)]);
  if (!rows.length) return null;
  const abstract = rows[0];
  const [versions] = await pool.query('SELECT * FROM abstract_versions WHERE abstract_id = ? ORDER BY version_number DESC', [abstract.id]);
  abstract.versions = versions;
  return normalize(abstract);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO abstracts
      (abstract_id, title, authors, corresponding_author, presenting_author, institution, email, phone, country, city_state, specialty, year_of_study, category_id, category, track, keywords, abstract_text, file_url, pdf_url, declaration_url, status, submission_status, submitted_at, award_nomination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.abstractId || null,
      data.title,
      data.authors || null,
      data.correspondingAuthor || data.presentingAuthor || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.country || null,
      data.city_state || null,
      data.specialty || null,
      data.year_of_study || null,
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.declaration_url || null,
      data.status || 'draft',
      data.status || 'draft',
      data.status === 'submitted' ? new Date() : null,
      Boolean(data.awardNomination),
    ]
  );
  await pool.query('UPDATE abstracts SET abstract_id = CONCAT(\'GHC-ABS-\', LPAD(id, 5, \'0\')) WHERE id = ? AND abstract_id IS NULL', [result.insertId]);
  return findById(result.insertId);
};

const updateIntegrity = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      ai_percentage = ?,
      plagiarism_percentage = ?
     WHERE id = ?`,
    [
      data.aiPercentage !== undefined ? data.aiPercentage : null,
      data.plagiarismPercentage !== undefined ? data.plagiarismPercentage : null,
      id
    ]
  );
  return findById(id);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      title = ?,
      authors = ?,
      corresponding_author = ?,
      presenting_author = ?,
      institution = ?,
      email = ?,
      phone = ?,
      country = ?,
      city_state = ?,
      specialty = ?,
      year_of_study = ?,
      category_id = ?,
      category = ?,
      track = ?,
      keywords = ?,
      abstract_text = ?,
      file_url = COALESCE(?, file_url),
      pdf_url = COALESCE(?, pdf_url),
      declaration_url = COALESCE(?, declaration_url),
      status = ?,
      submission_status = ?,
      award_nomination = ?
     WHERE id = ?`,
    [
      data.title,
      data.authors || null,
      data.correspondingAuthor || data.presentingAuthor || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.country || null,
      data.city_state || null,
      data.specialty || null,
      data.year_of_study || null,
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.declaration_url || null,
      data.status || 'draft',
      data.status || 'draft',
      Boolean(data.awardNomination),
      id,
    ]
  );
  return findById(id);
};



const review = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      review_score = ?,
      review_notes = ?,
      reviewer_id = ?,
      status = ?,
      award_nomination = ?
     WHERE id = ?`,
    [
      data.reviewScore,
      data.reviewNotes || null,
      data.reviewerId || null,
      data.status || 'under_review',
      Boolean(data.awardNomination),
      id,
    ]
  );
  return findById(id);
};

const setStatus = async (id, status) => {
  await pool.query('UPDATE abstracts SET status = ?, submission_status = ? WHERE id = ?', [status, status, id]);
  return findById(id);
};

const setAward = async (id, awardNomination) => {
  await pool.query('UPDATE abstracts SET award_nomination = ? WHERE id = ?', [Boolean(awardNomination), id]);
  return findById(id);
};

const stats = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(status = 'submitted' OR status = 'draft') AS newSubmissions,
      SUM(status = 'under_review') AS underReview,
      SUM(status = 'accepted') AS accepted,
      SUM(status = 'rejected') AS rejected,
      SUM(status = 'revision_requested') AS revisionRequested,
      SUM(award_nomination = 1) AS awardNominees,
      (SELECT COUNT(*) FROM abstract_review_assignments) AS totalAssignments,
      (SELECT COUNT(*) FROM abstract_reviews) AS totalCompletedReviews,
      (SELECT COUNT(*) FROM abstracts WHERE (status = 'submitted' OR status = 'draft') AND id NOT IN (SELECT abstract_id FROM abstract_review_assignments)) AS unassignedCount,
      (SELECT COUNT(*) FROM abstracts WHERE status = 'under_review' AND id IN (SELECT abstract_id FROM abstract_reviews)) AS awaitingDecisionCount
    FROM abstracts
  `);

  const r = rows[0] || {};
  const totalAssignments = Number(r.totalAssignments || 0);
  const totalCompletedReviews = Number(r.totalCompletedReviews || 0);
  const reviewsPending = Math.max(0, totalAssignments - totalCompletedReviews);
  const reviewCompletion = totalAssignments > 0 ? Math.round((totalCompletedReviews / totalAssignments) * 100) : 0;

  return {
    total: Number(r.total || 0),
    newSubmissions: Number(r.newSubmissions || 0),
    underReview: Number(r.underReview || 0),
    accepted: Number(r.accepted || 0),
    rejected: Number(r.rejected || 0),
    revisionRequested: Number(r.revisionRequested || 0),
    awardNominees: Number(r.awardNominees || 0),
    totalAssignments,
    totalCompletedReviews,
    reviewsPending,
    reviewCompletion,
    unassignedCount: Number(r.unassignedCount || 0),
    awaitingDecisionCount: Number(r.awaitingDecisionCount || 0),
  };
};

const findByToken = async (token) => {
  const [rows] = await pool.query('SELECT id FROM abstracts WHERE revision_token = ? AND revision_token_expires > NOW() LIMIT 1', [token]);
  if (!rows.length) return null;
  return findById(rows[0].id);
};

const createVersion = async (abstractId, versionNumber, pdfUrl, declarationUrl) => {
  await pool.query(
    'INSERT INTO abstract_versions (abstract_id, version_number, pdf_url, declaration_url) VALUES (?, ?, ?, ?)',
    [abstractId, versionNumber, pdfUrl, declarationUrl]
  );
};

const requestRevision = async (id, token, expires) => {
  const isNumeric = !isNaN(Number(id));
  if (isNumeric) {
    await pool.query(
      'UPDATE abstracts SET status = ?, submission_status = ?, revision_token = ?, revision_token_expires = ? WHERE id = ? OR abstract_id = ?',
      ['revision_requested', 'revision_requested', token, expires, id, String(id)]
    );
  } else {
    await pool.query(
      'UPDATE abstracts SET status = ?, submission_status = ?, revision_token = ?, revision_token_expires = ? WHERE abstract_id = ?',
      ['revision_requested', 'revision_requested', token, expires, String(id)]
    );
  }
  return findById(id);
};

const saveRevision = async (id, newVersion, pdfUrl, declarationUrl) => {
  const abstract = await findById(id);
  if (abstract) {
    await createVersion(id, abstract.currentVersion, abstract.pdfUrl, abstract.declarationUrl);
    await pool.query(
      `UPDATE abstracts SET 
        pdf_url = COALESCE(?, pdf_url), 
        file_url = COALESCE(?, file_url), 
        declaration_url = COALESCE(?, declaration_url), 
        current_version = ?, 
        status = 'under_review', 
        submission_status = 'under_review', 
        revision_token = NULL, 
        revision_token_expires = NULL 
       WHERE id = ?`,
      [pdfUrl, pdfUrl, declarationUrl, newVersion, id]
    );
  }
  return findById(id);
};

module.exports = { create, findById, findByToken, createVersion, requestRevision, saveRevision, list, review, setAward, setStatus, stats, update, updateIntegrity };
