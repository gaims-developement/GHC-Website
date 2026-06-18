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
  status: item.submission_status || item.status,
  submissionStatus: item.submission_status || item.status,
  finalScore: item.final_score === null ? null : Number(item.final_score),
  reviewScore: item.review_score === null ? null : Number(item.review_score),
  reviewNotes: item.review_notes,
  reviewerId: item.reviewer_id,
  awardNomination: Boolean(item.award_nomination),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const list = async ({ includeAll = false } = {}) => {
  const where = includeAll ? '' : "WHERE status = 'accepted'";
  const [rows] = await pool.query(
    `SELECT * FROM abstracts ${where}
     ORDER BY award_nomination DESC, category ASC, created_at DESC`
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM abstracts WHERE id = ? LIMIT 1', [id]);
  return normalize(rows[0]);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO abstracts
      (abstract_id, title, authors, corresponding_author, presenting_author, institution, email, phone, country, category_id, category, track, keywords, abstract_text, file_url, pdf_url, status, submission_status, submitted_at, award_nomination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.status || 'draft',
      data.status || 'draft',
      data.status === 'submitted' ? new Date() : null,
      Boolean(data.awardNomination),
    ]
  );
  await pool.query('UPDATE abstracts SET abstract_id = CONCAT("GHC-ABS-", LPAD(id, 5, "0")) WHERE id = ? AND abstract_id IS NULL', [result.insertId]);
  return findById(result.insertId);
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
      category_id = ?,
      category = ?,
      track = ?,
      keywords = ?,
      abstract_text = ?,
      file_url = COALESCE(?, file_url),
      pdf_url = COALESCE(?, pdf_url),
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
      data.categoryId || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.pdfUrl || null,
      data.status || 'draft',
      data.status || 'draft',
      Boolean(data.awardNomination),
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM abstracts WHERE id = ?', [id]);
  return result.affectedRows > 0;
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
      SUM(status = 'under_review') AS underReview,
      SUM(status = 'accepted') AS accepted,
      SUM(status = 'rejected') AS rejected,
      SUM(award_nomination = 1) AS awardNominees
    FROM abstracts
  `);

  return {
    total: Number(rows[0].total || 0),
    underReview: Number(rows[0].underReview || 0),
    accepted: Number(rows[0].accepted || 0),
    rejected: Number(rows[0].rejected || 0),
    awardNominees: Number(rows[0].awardNominees || 0),
  };
};

module.exports = { create, findById, list, remove, review, setAward, setStatus, stats, update };
