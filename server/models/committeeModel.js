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
    const normalizedType = String(type).trim().toLowerCase();
    // When viewing the organising committee, members of all committees
    // are included as requested (a person added in any committee is shown
    // in that committee and the organising committee as well).
    if (normalizedType !== 'organising' && normalizedType !== 'organizing') {
      clauses.push("committee_type = ?");
      params.push(normalizedType);
    }
  }
  
  if (!includeDrafts) clauses.push("status = 'published'");
  
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM committee_members ${where} ORDER BY display_order ASC, id ASC`,
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

const reorder = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return true;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      if (item.id && item.displayOrder !== undefined) {
        await connection.query(
          `UPDATE committee_members SET display_order = ? WHERE id = ?`,
          [Number(item.displayOrder || 0), item.id]
        );
      }
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ================= Committee Definitions (Names/Categories) =================

const normalizeCommittee = (c) => c && ({
  id: c.id,
  slug: c.slug,
  name: c.name,
  description: c.description,
  displayOrder: c.display_order,
  isActive: Boolean(c.is_active),
  createdAt: c.created_at,
  updatedAt: c.updated_at,
});

const listCommittees = async () => {
  const [rows] = await pool.query(`SELECT * FROM committees ORDER BY display_order ASC, name ASC`);
  return rows.map(normalizeCommittee);
};

const findCommitteeById = async (id) => {
  const [rows] = await pool.query(`SELECT * FROM committees WHERE id = ? LIMIT 1`, [id]);
  return normalizeCommittee(rows[0]);
};

const createCommittee = async (data) => {
  const slug = data.slug || data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const [result] = await pool.query(
    `INSERT INTO committees (slug, name, description, display_order, is_active)
     VALUES (?, ?, ?, ?, ?)`,
    [
      slug,
      data.name.trim(),
      data.description || null,
      Number(data.displayOrder || 0),
      data.isActive !== false ? 1 : 0,
    ]
  );
  return findCommitteeById(result.insertId);
};

const updateCommittee = async (id, data) => {
  const updates = [];
  const params = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name.trim());
  }
  if (data.slug !== undefined) {
    updates.push('slug = ?');
    params.push(data.slug.trim());
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    params.push(data.description);
  }
  if (data.displayOrder !== undefined) {
    updates.push('display_order = ?');
    params.push(Number(data.displayOrder));
  }
  if (data.isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(data.isActive ? 1 : 0);
  }

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE committees SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  return findCommitteeById(id);
};

const removeCommittee = async (id) => {
  const [result] = await pool.query(`DELETE FROM committees WHERE id = ?`, [id]);
  return result.affectedRows > 0;
};

module.exports = {
  list,
  findById,
  create,
  update,
  remove,
  reorder,
  listCommittees,
  findCommitteeById,
  createCommittee,
  updateCommittee,
  removeCommittee,
};
