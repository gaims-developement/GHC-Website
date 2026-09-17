const { pool } = require('../config/db');

const normalize = (member) => member && ({
  id: member.id,
  committeeType: member.committee_type,
  name: member.name,
  designation: member.designation,
  organization: member.organization,
  committeeRole: member.committee_role,
  biography: member.biography,
  photoUrl: member.photo_url,
  linkedinUrl: member.linkedin_url,
  twitterUrl: member.twitter_url,
  instagramUrl: member.instagram_url,
  displayOrder: member.display_order,
  status: member.status,
  createdAt: member.created_at,
  updatedAt: member.updated_at,
});

const list = async ({ type = null, includeDrafts = false } = {}) => {
  const clauses = [];
  const params = [];
  
  if (type) {
    clauses.push("committee_type = ?");
    params.push(type);
  }
  
  if (!includeDrafts) clauses.push("status = 'published'");
  
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM committee_members ${where} ORDER BY display_order ASC, created_at DESC`,
    params
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM committee_members WHERE id = ? LIMIT 1`, [id]);
  return normalize(rows[0]);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO committee_members
      (committee_type, name, designation, organization, committee_role, biography, photo_url, linkedin_url, twitter_url, instagram_url, display_order, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.committeeType,
      data.name,
      data.designation || null,
      data.organization || null,
      data.committeeRole || null,
      data.biography || null,
      data.photoUrl || null,
      data.linkedinUrl || null,
      data.twitterUrl || null,
      data.instagramUrl || null,
      Number(data.displayOrder || 0),
      data.status || 'draft',
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  const updates = [];
  const params = [];
  
  const addField = (field, value) => {
    if (value !== undefined) {
      updates.push(`${field} = ?`);
      params.push(value);
    }
  };

  addField('committee_type', data.committeeType);
  addField('name', data.name);
  addField('designation', data.designation);
  addField('organization', data.organization);
  addField('committee_role', data.committeeRole);
  addField('biography', data.biography);
  addField('photo_url', data.photoUrl);
  addField('linkedin_url', data.linkedinUrl);
  addField('twitter_url', data.twitterUrl);
  addField('instagram_url', data.instagramUrl);
  addField('display_order', data.displayOrder !== undefined ? Number(data.displayOrder) : undefined);
  addField('status', data.status);

  if (updates.length === 0) return findById(id);

  params.push(id);
  await pool.query(
    `UPDATE committee_members SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
  
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query(`DELETE FROM committee_members WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
};
