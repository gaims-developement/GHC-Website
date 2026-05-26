const { pool } = require('../config/db');

const baseUserSelect = `
  SELECT
    users.id,
    users.name,
    users.email,
    users.password_hash,
    users.role_id,
    users.created_at,
    users.updated_at,
    roles.name AS role
  FROM users
  LEFT JOIN roles ON roles.id = users.role_id
`;

const attachPermissions = async (user) => {
  if (!user) return null;

  const [permissions] = await pool.query(
    `SELECT permissions.key
     FROM role_permissions
     INNER JOIN permissions ON permissions.id = role_permissions.permission_id
     WHERE role_permissions.role_id = ?`,
    [user.role_id]
  );

  return {
    ...user,
    permissions: permissions.map((permission) => permission.key),
  };
};

const serialize = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleId: user.role_id,
  permissions: user.permissions || [],
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const findByEmail = async (email) => {
  const [rows] = await pool.query(`${baseUserSelect} WHERE users.email = ? LIMIT 1`, [email]);
  return attachPermissions(rows[0] || null);
};

const findById = async (id) => {
  const [rows] = await pool.query(`${baseUserSelect} WHERE users.id = ? LIMIT 1`, [id]);
  return attachPermissions(rows[0] || null);
};

const getRoleByName = async (roleName) => {
  const [rows] = await pool.query('SELECT id, name FROM roles WHERE name = ? LIMIT 1', [roleName]);
  return rows[0] || null;
};

const create = async ({ name, email, passwordHash, roleId }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, roleId]
  );

  return result.insertId;
};

const list = async () => {
  const [rows] = await pool.query(`
    SELECT users.id, users.name, users.email, users.created_at, users.updated_at, roles.name AS role
    FROM users
    LEFT JOIN roles ON roles.id = users.role_id
    ORDER BY users.created_at DESC
  `);

  return rows;
};

module.exports = {
  attachPermissions,
  create,
  findByEmail,
  findById,
  getRoleByName,
  list,
  serialize,
};
