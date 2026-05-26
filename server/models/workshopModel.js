const { pool } = require('../config/db');

const slugify = (value = '') => String(value)
  .toLowerCase()
  .trim()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || `workshop-${Date.now()}`;

const parseJson = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalize = (workshop) => workshop && ({
  id: workshop.id,
  slug: workshop.slug || slugify(workshop.title),
  title: workshop.title,
  faculty: workshop.faculty,
  description: workshop.description,
  workshopType: workshop.workshop_type,
  requirements: workshop.requirements,
  learningOutcomes: workshop.learning_outcomes,
  whoShouldAttend: workshop.who_should_attend,
  faq: parseJson(workshop.faq),
  prerequisites: workshop.prerequisites,
  capacity: Number(workshop.capacity || 0),
  registeredCount: Number(workshop.registered_count || 0),
  duration: workshop.duration,
  venue: workshop.venue,
  date: workshop.date,
  price: Number(workshop.price || 0),
  imageUrl: workshop.image_url,
  featured: Boolean(workshop.featured),
  status: workshop.status,
  displayOrder: workshop.display_order,
  createdAt: workshop.created_at,
  updatedAt: workshop.updated_at,
});

const list = async ({ includeDrafts = false } = {}) => {
  const where = includeDrafts ? '' : "WHERE status = 'published'";
  const [rows] = await pool.query(
    `SELECT * FROM workshops ${where}
     ORDER BY featured DESC, display_order ASC, date ASC, created_at DESC`
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM workshops WHERE id = ? LIMIT 1', [id]);
  return normalize(rows[0]);
};

const findBySlug = async (slug) => {
  const [rows] = await pool.query('SELECT * FROM workshops WHERE slug = ? OR id = ? LIMIT 1', [slug, slug]);
  if (rows[0]) return normalize(rows[0]);
  const [allRows] = await pool.query('SELECT * FROM workshops');
  return allRows.map(normalize).find((workshop) => workshop.slug === slug);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO workshops
      (title, slug, faculty, description, workshop_type, requirements, learning_outcomes, who_should_attend, faq, prerequisites, capacity, registered_count, duration, venue, date, price, image_url, featured, status, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.slug || slugify(data.title),
      data.faculty || null,
      data.description || null,
      data.workshopType || null,
      data.requirements || null,
      data.learningOutcomes || null,
      data.whoShouldAttend || null,
      data.faq ? JSON.stringify(data.faq) : null,
      data.prerequisites || null,
      Number(data.capacity || 0),
      Number(data.registeredCount || 0),
      data.duration || null,
      data.venue || null,
      data.date || null,
      Number(data.price || 0),
      data.imageUrl || null,
      Boolean(data.featured),
      data.status || 'draft',
      Number(data.displayOrder || 0),
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE workshops SET
      title = ?,
      slug = ?,
      faculty = ?,
      description = ?,
      workshop_type = ?,
      requirements = ?,
      learning_outcomes = ?,
      who_should_attend = ?,
      faq = ?,
      prerequisites = ?,
      capacity = ?,
      registered_count = ?,
      duration = ?,
      venue = ?,
      date = ?,
      price = ?,
      image_url = COALESCE(?, image_url),
      featured = ?,
      status = ?,
      display_order = ?
     WHERE id = ?`,
    [
      data.title,
      data.slug || slugify(data.title),
      data.faculty || null,
      data.description || null,
      data.workshopType || null,
      data.requirements || null,
      data.learningOutcomes || null,
      data.whoShouldAttend || null,
      data.faq ? JSON.stringify(data.faq) : null,
      data.prerequisites || null,
      Number(data.capacity || 0),
      Number(data.registeredCount || 0),
      data.duration || null,
      data.venue || null,
      data.date || null,
      Number(data.price || 0),
      data.imageUrl || null,
      Boolean(data.featured),
      data.status || 'draft',
      Number(data.displayOrder || 0),
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM workshops WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const publish = async (id) => {
  await pool.query("UPDATE workshops SET status = 'published' WHERE id = ?", [id]);
  return findById(id);
};

const close = async (id) => {
  await pool.query("UPDATE workshops SET status = 'closed' WHERE id = ?", [id]);
  return findById(id);
};

const reorder = async (items) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      await connection.query('UPDATE workshops SET display_order = ? WHERE id = ?', [
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
      SUM(status = 'published') AS published,
      SUM(status = 'draft') AS drafts,
      SUM(status = 'closed') AS closed,
      SUM(capacity) AS totalCapacity,
      SUM(registered_count) AS registered,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS upcoming,
      SUM(CASE WHEN capacity > 0 AND registered_count / capacity >= 0.75 THEN 1 ELSE 0 END) AS popularWorkshops
    FROM workshops
  `);

  const data = rows[0];
  const totalCapacity = Number(data.totalCapacity || 0);
  const registered = Number(data.registered || 0);

  return {
    total: Number(data.total || 0),
    featured: Number(data.featured || 0),
    published: Number(data.published || 0),
    drafts: Number(data.drafts || 0),
    closed: Number(data.closed || 0),
    upcoming: Number(data.upcoming || 0),
    seatsRemaining: Math.max(totalCapacity - registered, 0),
    popularWorkshops: Number(data.popularWorkshops || 0),
    occupancy: totalCapacity ? Math.round((registered / totalCapacity) * 100) : 0,
  };
};

const incrementRegistered = async (id) => {
  await pool.query('UPDATE workshops SET registered_count = registered_count + 1 WHERE id = ?', [id]);
  return findById(id);
};

const createRegistration = async ({ workshopId, registrationId = null, paymentId = null, status = 'confirmed' }) => {
  const [result] = await pool.query(
    `INSERT INTO workshop_registrations (workshop_id, registration_id, payment_id, status)
     VALUES (?, ?, ?, ?)`,
    [workshopId, registrationId, paymentId, status]
  );
  return result.insertId;
};

module.exports = { close, create, createRegistration, findById, findBySlug, incrementRegistered, list, publish, remove, reorder, stats, update };
