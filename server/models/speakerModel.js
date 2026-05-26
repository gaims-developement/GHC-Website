const { pool } = require('../config/db');

const normalize = (speaker) => speaker && ({
  id: speaker.id,
  name: speaker.name,
  designation: speaker.designation,
  institution: speaker.institution,
  bio: speaker.bio,
  topic: speaker.topic,
  photoUrl: speaker.photo_url,
  linkedinUrl: speaker.linkedin_url,
  instagramUrl: speaker.instagram_url,
  featured: Boolean(speaker.featured),
  keynote: Boolean(speaker.keynote),
  displayOrder: speaker.display_order,
  status: speaker.status,
  createdAt: speaker.created_at,
  updatedAt: speaker.updated_at,
});

const list = async ({ includeDrafts = false } = {}) => {
  const where = includeDrafts ? '' : "WHERE status = 'published'";
  const [rows] = await pool.query(
    `SELECT * FROM speakers ${where}
     ORDER BY featured DESC, display_order ASC, created_at DESC`
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM speakers WHERE id = ? LIMIT 1', [id]);
  return normalize(rows[0]);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO speakers
      (name, designation, institution, bio, topic, photo_url, linkedin_url, instagram_url, featured, keynote, display_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.designation || null,
      data.institution || null,
      data.bio || null,
      data.topic || null,
      data.photoUrl || null,
      data.linkedinUrl || null,
      data.instagramUrl || null,
      Boolean(data.featured),
      Boolean(data.keynote),
      Number(data.displayOrder || 0),
      data.status || 'draft',
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE speakers SET
      name = ?,
      designation = ?,
      institution = ?,
      bio = ?,
      topic = ?,
      photo_url = COALESCE(?, photo_url),
      linkedin_url = ?,
      instagram_url = ?,
      featured = ?,
      keynote = ?,
      display_order = ?,
      status = ?
     WHERE id = ?`,
    [
      data.name,
      data.designation || null,
      data.institution || null,
      data.bio || null,
      data.topic || null,
      data.photoUrl || null,
      data.linkedinUrl || null,
      data.instagramUrl || null,
      Boolean(data.featured),
      Boolean(data.keynote),
      Number(data.displayOrder || 0),
      data.status || 'draft',
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM speakers WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const publish = async (id) => {
  await pool.query("UPDATE speakers SET status = 'published' WHERE id = ?", [id]);
  return findById(id);
};

const reorder = async (items) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      await connection.query('UPDATE speakers SET display_order = ? WHERE id = ?', [
        Number(item.displayOrder || 0),
        item.id,
      ]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const stats = async () => {
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(featured = 1) AS featured,
      SUM(keynote = 1) AS keynotes,
      SUM(status = 'draft') AS drafts
    FROM speakers
  `);
  return rows[0];
};

module.exports = { create, findById, list, publish, remove, reorder, stats, update };
