const { pool } = require('../config/db');
const { applyEventScope, getCurrentEventId } = require('../utils/eventScope');

const normalize = (speaker) => speaker && ({
  id: speaker.id,
  name: speaker.full_name || speaker.name,
  fullName: speaker.full_name || speaker.name,
  designation: speaker.designation,
  institution: speaker.organization || speaker.institution,
  organization: speaker.organization || speaker.institution,
  specialization: speaker.specialization,
  country: speaker.country,
  city: speaker.city,
  bio: speaker.bio,
  topic: speaker.topic,
  achievements: speaker.achievements,
  travelStatus: speaker.travel_status,
  accommodationStatus: speaker.accommodation_status,
  specialRequirements: speaker.special_requirements,
  email: speaker.email,
  phone: speaker.phone,
  photoUrl: speaker.profile_image || speaker.photo_url,
  profileImage: speaker.profile_image || speaker.photo_url,
  linkedinUrl: speaker.linkedin_url,
  twitterUrl: speaker.twitter_url,
  websiteUrl: speaker.website_url,
  instagramUrl: speaker.instagram_url,
  eventId: speaker.event_id,
  featured: Boolean(speaker.featured),
  keynote: Boolean(speaker.keynote),
  displayOrder: speaker.display_order,
  status: speaker.status,
  createdAt: speaker.created_at,
  updatedAt: speaker.updated_at,
});

const list = async ({ includeDrafts = false, req = null } = {}) => {
  const clauses = [];
  const params = [];
  applyEventScope(clauses, params, req, 'event_id');
  if (!includeDrafts) clauses.push("status IN ('published', 'confirmed')");
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM speakers ${where}
     ORDER BY featured DESC, display_order ASC, created_at DESC`,
    params
  );
  return rows.map(normalize);
};

const findById = async (id, req = null) => {
  const clauses = ['id = ?'];
  const params = [id];
  applyEventScope(clauses, params, req, 'event_id');
  const [rows] = await pool.query(`SELECT * FROM speakers WHERE ${clauses.join(' AND ')} LIMIT 1`, params);
  return normalize(rows[0]);
};

const create = async (data, req = null) => {
  const eventId = getCurrentEventId(req);
  const [result] = await pool.query(
    `INSERT INTO speakers
      (name, full_name, designation, institution, organization, specialization, country, city, bio, topic, achievements, travel_status, accommodation_status, special_requirements, email, phone, photo_url, profile_image, linkedin_url, twitter_url, website_url, instagram_url, featured, keynote, display_order, status, event_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name || data.fullName,
      data.name || data.fullName,
      data.designation || null,
      data.institution || null,
      data.organization || data.institution || null,
      data.specialization || null,
      data.country || null,
      data.city || null,
      data.bio || null,
      data.topic || null,
      data.achievements || null,
      data.travelStatus || null,
      data.accommodationStatus || null,
      data.specialRequirements || null,
      data.email || null,
      data.phone || null,
      data.photoUrl || null,
      data.photoUrl || null,
      data.linkedinUrl || null,
      data.twitterUrl || null,
      data.websiteUrl || null,
      data.instagramUrl || null,
      Boolean(data.featured),
      Boolean(data.keynote),
      Number(data.displayOrder || 0),
      data.status || 'draft',
      eventId,
    ]
  );
  return findById(result.insertId, req);
};

const update = async (id, data, req = null) => {
  const clauses = ['id = ?'];
  const whereParams = [id];
  applyEventScope(clauses, whereParams, req, 'event_id');
  await pool.query(
    `UPDATE speakers SET
      name = ?,
      full_name = ?,
      designation = ?,
      institution = ?,
      organization = ?,
      specialization = ?,
      country = ?,
      city = ?,
      bio = ?,
      topic = ?,
      achievements = ?,
      travel_status = ?,
      accommodation_status = ?,
      special_requirements = ?,
      email = ?,
      phone = ?,
      photo_url = COALESCE(?, photo_url),
      profile_image = COALESCE(?, profile_image),
      linkedin_url = ?,
      twitter_url = ?,
      website_url = ?,
      instagram_url = ?,
      featured = ?,
      keynote = ?,
      display_order = ?,
      status = ?
     WHERE ${clauses.join(' AND ')}`,
    [
      data.name || data.fullName,
      data.name || data.fullName,
      data.designation || null,
      data.institution || null,
      data.organization || data.institution || null,
      data.specialization || null,
      data.country || null,
      data.city || null,
      data.bio || null,
      data.topic || null,
      data.achievements || null,
      data.travelStatus || null,
      data.accommodationStatus || null,
      data.specialRequirements || null,
      data.email || null,
      data.phone || null,
      data.photoUrl || null,
      data.photoUrl || null,
      data.linkedinUrl || null,
      data.twitterUrl || null,
      data.websiteUrl || null,
      data.instagramUrl || null,
      Boolean(data.featured),
      Boolean(data.keynote),
      Number(data.displayOrder || 0),
      data.status || 'draft',
      ...whereParams,
    ]
  );
  return findById(id, req);
};

const remove = async (id, req = null) => {
  const clauses = ['id = ?'];
  const params = [id];
  applyEventScope(clauses, params, req, 'event_id');
  const [result] = await pool.query(`DELETE FROM speakers WHERE ${clauses.join(' AND ')}`, params);
  return result.affectedRows > 0;
};

const publish = async (id, req = null) => {
  const clauses = ['id = ?'];
  const params = [id];
  applyEventScope(clauses, params, req, 'event_id');
  await pool.query(`UPDATE speakers SET status = 'published' WHERE ${clauses.join(' AND ')}`, params);
  return findById(id, req);
};

const reorder = async (items, req = null) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      const clauses = ['id = ?'];
      const params = [Number(item.displayOrder || 0), item.id];
      applyEventScope(clauses, params, req, 'event_id');
      await connection.query(`UPDATE speakers SET display_order = ? WHERE ${clauses.join(' AND ')}`, params);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const stats = async (req = null) => {
  const clauses = [];
  const params = [];
  applyEventScope(clauses, params, req, 'event_id');
  const [rows] = await pool.query(`
    SELECT
      COUNT(*) AS total,
      SUM(featured = 1) AS featured,
      SUM(keynote = 1) AS keynotes,
      SUM(status = 'draft') AS drafts,
      SUM(status = 'confirmed' OR status = 'published') AS confirmed,
      SUM(status = 'draft') AS pendingApproval
    FROM speakers
    ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
  `, params);
  return rows[0];
};

module.exports = { create, findById, list, publish, remove, reorder, stats, update };
