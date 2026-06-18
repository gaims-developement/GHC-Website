const { pool } = require('../config/db');

const baseUserSelect = `
  SELECT
    users.id,
    users.name,
    users.email,
    users.password_hash,
    users.phone,
    users.profile_image,
    users.is_active,
    users.is_locked,
    users.force_password_reset,
    users.role_id,
    users.created_at,
    users.updated_at,
    roles.name AS role
  FROM users
  LEFT JOIN roles ON roles.id = users.role_id
`;

const attachPermissions = async (user) => {
  if (!user) return null;

  if (user.role === 'SUPER_ADMIN') {
    const [permissions] = await pool.query('SELECT `key` FROM permissions');
    const [modules] = await pool.query(`
      SELECT module_key, label, permission_key, route_key, icon, display_order
      FROM modules
      WHERE active = TRUE
      ORDER BY display_order ASC, label ASC
    `);

    return {
      ...user,
      permissions: permissions.map((permission) => permission.key),
      modules,
    };
  }

  const [permissions] = await pool.query(
    `SELECT DISTINCT permission_key AS \`key\`
     FROM (
       SELECT permissions.key AS permission_key
       FROM role_permissions
       INNER JOIN permissions ON permissions.id = role_permissions.permission_id
       WHERE role_permissions.role_id = ?
       UNION
       SELECT modules.permission_key
       FROM team_members
       INNER JOIN team_modules ON team_modules.team_id = team_members.team_id
       INNER JOIN modules ON modules.id = team_modules.module_id
       WHERE team_members.user_id = ? AND modules.permission_key IS NOT NULL AND modules.active = TRUE
     ) granted_permissions`,
    [user.role_id, user.id]
  );
  const permissionKeys = permissions.map((permission) => permission.key).filter(Boolean);
  const [modules] = await pool.query(
    `SELECT DISTINCT modules.module_key, modules.label, modules.permission_key, modules.route_key, modules.icon, modules.display_order
     FROM modules
     WHERE modules.active = TRUE
       AND (
         modules.permission_key IN (?)
         OR EXISTS (
           SELECT 1
           FROM team_members
           INNER JOIN team_modules ON team_modules.team_id = team_members.team_id
           WHERE team_members.user_id = ? AND team_modules.module_id = modules.id
         )
       )
     ORDER BY modules.display_order ASC, modules.label ASC`,
    [permissionKeys.length ? permissionKeys : ['__none__'], user.id]
  );

  return {
    ...user,
    permissions: permissionKeys,
    modules,
  };
};

const serialize = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleId: user.role_id,
  permissions: user.permissions || [],
  modules: user.modules || [],
  phone: user.phone,
  profileImage: user.profile_image,
  isActive: user.is_active !== false && user.is_active !== 0,
  isLocked: user.is_locked === true || user.is_locked === 1,
  forcePasswordReset: user.force_password_reset === true || user.force_password_reset === 1,
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

const create = async ({ name, email, passwordHash, roleId, phone = null, profileImage = null, isActive = true }) => {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, phone, profile_image, is_active, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, email, passwordHash, phone, profileImage, isActive, roleId]
  );

  return result.insertId;
};

const list = async () => {
  const [rows] = await pool.query(`
    SELECT users.id, users.name, users.email, users.phone, users.profile_image, users.is_active, users.is_locked, users.force_password_reset, users.created_at, users.updated_at, roles.name AS role, roles.id AS role_id
    FROM users
    LEFT JOIN roles ON roles.id = users.role_id
    ORDER BY users.created_at DESC
  `);

  return rows;
};

const updatePassword = async (id, passwordHash) => {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
};

const update = async (id, { name, email, phone = null, roleId, isActive = true }) => {
  await pool.query(
    'UPDATE users SET name = ?, email = ?, phone = ?, role_id = ?, is_active = ? WHERE id = ?',
    [name, email, phone, roleId, isActive, id]
  );
};

module.exports = {
  attachPermissions,
  create,
  findByEmail,
  findById,
  getRoleByName,
  list,
  serialize,
  update,
  updatePassword,
};
