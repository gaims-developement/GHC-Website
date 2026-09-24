const { pool } = require('../models/hospitalityModel');

const toSnakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = str => str.replace(/_([a-z])/g, g => g[1].toUpperCase());

const mapKeys = (obj, fn) => {
  const newObj = {};
  for (const [key, value] of Object.entries(obj)) {
    newObj[fn(key)] = value;
  }
  return newObj;
};

const createHandlers = (tableName, itemName) => ({
  getAll: async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${tableName}`);
      const camelRows = rows.map(row => mapKeys(row, toCamelCase));
      res.json({ [`${itemName}s`]: camelRows });
    } catch (error) {
      res.status(500).json({ message: `Error fetching ${itemName}s`, error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const snakedBody = mapKeys(req.body, toSnakeCase);
      const entries = Object.entries(snakedBody).filter(([k, v]) => k !== 'id' && k !== '_id' && v !== '');
      if (entries.length === 0) return res.status(400).json({ message: 'No valid fields provided' });
      
      const keys = entries.map(([k]) => k);
      const values = entries.map(([, v]) => v);
      const placeholders = keys.map(() => '?').join(', ');
      
      const [result] = await pool.query(
        `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders})`,
        values
      );
      
      const [newRows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [result.insertId]);
      res.status(201).json(mapKeys(newRows[0], toCamelCase));
    } catch (error) {
      res.status(500).json({ message: `Error creating ${itemName}`, error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const snakedBody = mapKeys(req.body, toSnakeCase);
      const entries = Object.entries(snakedBody).filter(([k]) => k !== 'id' && k !== '_id' && k !== 'created_at' && k !== 'updated_at');
      if (entries.length === 0) return res.status(400).json({ message: 'No valid fields provided to update' });

      const keys = entries.map(([k]) => k);
      const values = entries.map(([, v]) => v);
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      
      await pool.query(
        `UPDATE ${tableName} SET ${setClause} WHERE id = ?`,
        [...values, req.params.id]
      );
      
      const [updatedRows] = await pool.query(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (updatedRows.length === 0) return res.status(404).json({ message: `${itemName} not found` });
      res.json(mapKeys(updatedRows[0], toCamelCase));
    } catch (error) {
      res.status(500).json({ message: `Error updating ${itemName}`, error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const [result] = await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (result.affectedRows === 0) return res.status(404).json({ message: `${itemName} not found` });
      res.json({ message: `${itemName} deleted successfully` });
    } catch (error) {
      res.status(500).json({ message: `Error deleting ${itemName}`, error: error.message });
    }
  }
});

module.exports = {
  venue: createHandlers('venues', 'venue'),
  cafe: createHandlers('cafes', 'cafe'),
  stay: createHandlers('stays', 'stay')
};
