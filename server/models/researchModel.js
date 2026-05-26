const { pool } = require('../config/db');

const normalize = (item) => item && ({
  id: item.id,
  title: item.title,
  authors: item.authors,
  presentingAuthor: item.presenting_author,
  institution: item.institution,
  email: item.email,
  phone: item.phone,
  category: item.category,
  track: item.track,
  keywords: item.keywords,
  abstractText: item.abstract_text,
  pdfUrl: item.pdf_url,
  status: item.status,
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
      (title, authors, presenting_author, institution, email, phone, category, track, keywords, abstract_text, pdf_url, status, award_nomination)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.authors || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
      data.status || 'draft',
      Boolean(data.awardNomination),
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE abstracts SET
      title = ?,
      authors = ?,
      presenting_author = ?,
      institution = ?,
      email = ?,
      phone = ?,
      category = ?,
      track = ?,
      keywords = ?,
      abstract_text = ?,
      pdf_url = COALESCE(?, pdf_url),
      status = ?,
      award_nomination = ?
     WHERE id = ?`,
    [
      data.title,
      data.authors || null,
      data.presentingAuthor || null,
      data.institution || null,
      data.email || null,
      data.phone || null,
      data.category || 'poster',
      data.track || null,
      data.keywords || null,
      data.abstractText || null,
      data.pdfUrl || null,
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
  await pool.query('UPDATE abstracts SET status = ? WHERE id = ?', [status, id]);
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
