const { pool } = require('../config/db');

const normalize = (partner) => partner && ({
  id: partner.id,
  name: partner.name,
  logo: partner.logo,
  website: partner.website,
  tier: partner.tier,
  displayOrder: Number(partner.display_order || 0),
  active: Boolean(partner.active),
  createdAt: partner.created_at,
});

const list = async ({ includeInactive = false } = {}) => {
  const where = includeInactive ? '' : 'WHERE active = TRUE';
  const [rows] = await pool.query(
    `SELECT * FROM partners ${where}
     ORDER BY display_order ASC, created_at DESC`
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM partners WHERE id = ? LIMIT 1', [id]);
  return normalize(rows[0]);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO partners (name, logo, website, tier, display_order, active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.logo || null,
      data.website || null,
      data.tier || null,
      Number(data.displayOrder || 0),
      data.active === undefined ? true : Boolean(data.active),
    ]
  );
  return findById(result.insertId);
};

const update = async (id, data) => {
  await pool.query(
    `UPDATE partners SET
      name = ?,
      logo = COALESCE(?, logo),
      website = ?,
      tier = ?,
      display_order = ?,
      active = ?
     WHERE id = ?`,
    [
      data.name,
      data.logo || null,
      data.website || null,
      data.tier || null,
      Number(data.displayOrder || 0),
      Boolean(data.active),
      id,
    ]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM partners WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

const reorder = async (items) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of items) {
      await connection.query('UPDATE partners SET display_order = ? WHERE id = ?', [
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

module.exports = { create, findById, list, remove, reorder, update };
