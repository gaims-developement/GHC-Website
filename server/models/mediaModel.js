const { pool } = require('../config/db');

const normalize = (asset) => asset && ({
  id: asset.id,
  filename: asset.filename,
  originalName: asset.original_name,
  url: asset.url,
  publicId: asset.public_id,
  resourceType: asset.resource_type,
  fileType: asset.file_type,
  sizeBytes: Number(asset.size_bytes || 0),
  createdAt: asset.created_at,
});

const list = async ({ search = '', type = 'all' } = {}) => {
  const filters = [];
  const values = [];

  if (search) {
    filters.push('(original_name LIKE ? OR filename LIKE ? OR file_type LIKE ?)');
    values.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (type && type !== 'all') {
    filters.push('resource_type = ?');
    values.push(type);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT * FROM media_assets ${where} ORDER BY created_at DESC`,
    values
  );
  return rows.map(normalize);
};

const findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM media_assets WHERE id = ? LIMIT 1', [id]);
  return normalize(rows[0]);
};

const create = async (data) => {
  const [result] = await pool.query(
    `INSERT INTO media_assets
      (filename, original_name, url, public_id, resource_type, file_type, size_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.filename || null,
      data.originalName || null,
      data.url,
      data.publicId || null,
      data.resourceType || null,
      data.fileType || null,
      Number(data.sizeBytes || 0),
    ]
  );
  return findById(result.insertId);
};

const remove = async (id) => {
  const [result] = await pool.query('DELETE FROM media_assets WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { create, findById, list, remove };
