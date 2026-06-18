const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const Settings = require('../models/settingsModel');
const User = require('../models/userModel');
const asyncHandler = require('../utils/asyncHandler');

const number = (value) => Number(value || 0);
const allowedSorts = {
  name: 'teams.name ASC',
  members: 'memberCount DESC',
  created: 'teams.created_at DESC',
};

const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const signToken = (user, extra = {}) =>
  jwt.sign(
    { ...User.serialize(user), ...extra },
    process.env.JWT_SECRET || 'change-this-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const dashboard = asyncHandler(async (_req, res) => {
  const [[registrations]] = await pool.query('SELECT COUNT(*) AS total, SUM(registration_status = "pending") AS pending FROM registrations');
  const [[speakers]] = await pool.query('SELECT COUNT(*) AS total FROM speakers');
  const [[workshops]] = await pool.query('SELECT COUNT(*) AS total FROM workshops');
  const [[sponsors]] = await pool.query('SELECT COUNT(*) AS total FROM sponsors WHERE is_active = TRUE');
  const [[abstracts]] = await pool.query('SELECT COUNT(*) AS total, SUM(status IN ("submitted", "under_review")) AS pending FROM abstracts');
  const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  const [[payments]] = await pool.query(`
    SELECT
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS revenue,
      SUM(status = 'paid') AS paid_count,
      SUM(status IN ('created', 'pending')) AS pending_count
    FROM payments
  `);
  const activity = await ActivityLog.list({ limit: 10 });

  res.json({
    kpis: {
      registrations: number(registrations.total),
      speakers: number(speakers.total),
      workshops: number(workshops.total),
      sponsors: number(sponsors.total),
      abstracts: number(abstracts.total),
      users: number(users.total),
      pendingApprovals: number(registrations.pending) + number(abstracts.pending) + number(payments.pending_count),
      revenue: number(payments.revenue),
      paidPayments: number(payments.paid_count),
    },
    recentActivity: activity,
  });
});

const metadata = asyncHandler(async (_req, res) => {
  const [roles] = await pool.query('SELECT id, name FROM roles ORDER BY name ASC');
  const [rolePermissions] = await pool.query(`
    SELECT role_permissions.role_id AS roleId, permissions.key
    FROM role_permissions
    INNER JOIN permissions ON permissions.id = role_permissions.permission_id
  `);
  const [permissions] = await pool.query('SELECT id, `key`, description FROM permissions ORDER BY `key` ASC');
  const [modules] = await pool.query(`
    SELECT id, name, slug, description, module_key AS moduleKey, label, permission_key AS permissionKey, route_key AS routeKey, icon, display_order AS displayOrder, active
    FROM modules
    ORDER BY display_order ASC, label ASC
  `);
  const users = await User.list();

  const permissionsByRole = rolePermissions.reduce((acc, row) => {
    acc[row.roleId] = [...(acc[row.roleId] || []), row.key];
    return acc;
  }, {});

  res.json({ roles: roles.map((role) => ({ ...role, permissions: permissionsByRole[role.id] || [] })), permissions, modules, users });
});

const visibleModules = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ modules: User.serialize(user).modules });
});

const uniqueSlug = async (table, baseSlug, currentId = null) => {
  let nextSlug = baseSlug || 'item';
  let suffix = 2;

  while (true) {
    const params = currentId ? [nextSlug, currentId] : [nextSlug];
    const [rows] = await pool.query(
      `SELECT id FROM ${table} WHERE slug = ? ${currentId ? 'AND id <> ?' : ''} LIMIT 1`,
      params
    );
    if (!rows.length) return nextSlug;
    nextSlug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
};

const listTeams = asyncHandler(async (req, res) => {
  const search = `%${(req.query.search || '').trim()}%`;
  const status = req.query.status;
  const statusClause = status === 'active' ? 'AND teams.is_active = TRUE' : status === 'inactive' ? 'AND teams.is_active = FALSE' : '';
  const sort = allowedSorts[req.query.sort] || allowedSorts.created;

  const [rows] = await pool.query(`
    SELECT
      teams.id,
      teams.name,
      teams.slug,
      teams.description,
      teams.icon,
      teams.color,
      teams.is_active AS isActive,
      teams.created_at AS createdAt,
      teams.updated_at AS updatedAt,
      COUNT(DISTINCT team_members.user_id) AS memberCount,
      MAX(activity_logs.timestamp) AS lastActivity,
      COALESCE(JSON_ARRAYAGG(DISTINCT JSON_OBJECT(
        'id', modules.id,
        'moduleKey', modules.module_key,
        'name', modules.name,
        'slug', modules.slug,
        'label', modules.label,
        'permissionKey', modules.permission_key,
        'routeKey', modules.route_key
      )), JSON_ARRAY()) AS assignedModules
    FROM teams
    LEFT JOIN team_members ON team_members.team_id = teams.id
    LEFT JOIN team_modules ON team_modules.team_id = teams.id
    LEFT JOIN modules ON modules.id = team_modules.module_id
    LEFT JOIN activity_logs ON activity_logs.user_id = team_members.user_id
    WHERE (teams.name LIKE ? OR teams.description LIKE ? OR teams.slug LIKE ?)
    ${statusClause}
    GROUP BY teams.id
    ORDER BY ${sort}
  `, [search, search, search]);

  const teams = await Promise.all(rows.map(async (team) => {
    const modules = parseJson(team.assignedModules, []).filter((module) => module.id);
    const pendingTasks = await pendingTasksForModules(modules);
    return {
      ...team,
      memberCount: number(team.memberCount),
      assignedModules: modules,
      pendingTasks,
    };
  }));

  res.json({ teams });
});

const getTeam = asyncHandler(async (req, res) => {
  const [[team]] = await pool.query(
    'SELECT id, name, slug, description, icon, color, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM teams WHERE id = ? LIMIT 1',
    [req.params.id]
  );
  if (!team) return res.status(404).json({ message: 'Team not found' });

  const [modules] = await pool.query(`
    SELECT modules.id, modules.name, modules.slug, modules.description, modules.module_key AS moduleKey, modules.label, modules.permission_key AS permissionKey, modules.route_key AS routeKey
    FROM team_modules
    INNER JOIN modules ON modules.id = team_modules.module_id
    WHERE team_modules.team_id = ?
    ORDER BY modules.display_order ASC
  `, [req.params.id]);
  const [members] = await pool.query(`
    SELECT users.id, users.name, users.email, users.phone, users.profile_image AS profileImage, users.is_active AS isActive,
           roles.id AS roleId, roles.name AS role, team_members.team_role AS teamRole
    FROM team_members
    INNER JOIN users ON users.id = team_members.user_id
    LEFT JOIN roles ON roles.id = users.role_id
    WHERE team_members.team_id = ?
    ORDER BY team_members.team_role ASC, users.name ASC
  `, [req.params.id]);
  const [[activity]] = await pool.query(`
    SELECT MAX(activity_logs.timestamp) AS lastActivity
    FROM team_members
    LEFT JOIN activity_logs ON activity_logs.user_id = team_members.user_id
    WHERE team_members.team_id = ?
  `, [req.params.id]);

  res.json({ team: { ...team, modules, members, lastActivity: activity.lastActivity, pendingTasks: await pendingTasksForModules(modules) } });
});

const setTeamModules = async ({ teamId, moduleIds = [], actorId = null }) => {
  const [existing] = await pool.query('SELECT module_id FROM team_modules WHERE team_id = ?', [teamId]);
  const before = new Set(existing.map((row) => row.module_id));
  const after = new Set(moduleIds);

  await pool.query('DELETE FROM team_modules WHERE team_id = ?', [teamId]);
  if (moduleIds.length) {
    await pool.query('INSERT INTO team_modules (team_id, module_id) VALUES ?', [moduleIds.map((moduleId) => [teamId, moduleId])]);
  }

  for (const moduleId of moduleIds) {
    if (!before.has(moduleId)) {
      await ActivityLog.logActivity({ userId: actorId, action: 'assigned_module', module: 'teams', recordId: String(teamId), metadata: { moduleId } });
    }
  }
  for (const moduleId of before) {
    if (!after.has(moduleId)) {
      await ActivityLog.logActivity({ userId: actorId, action: 'removed_module', module: 'teams', recordId: String(teamId), metadata: { moduleId } });
    }
  }
};

const sanitizeIds = (value) => Array.from(new Set((Array.isArray(value) ? value : []).map(Number).filter(Boolean)));

const createTeam = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Team name is required' });

  const slug = await uniqueSlug('teams', slugify(name));
  const [result] = await pool.query('INSERT INTO teams (name, slug, description, icon, color, is_active) VALUES (?, ?, ?, ?, ?, ?)', [
    name,
    slug,
    req.body.description?.trim() || null,
    req.body.icon?.trim() || null,
    req.body.color?.trim() || '#4fc3f7',
    req.body.isActive !== false,
  ]);
  await setTeamModules({
    teamId: result.insertId,
    moduleIds: sanitizeIds(req.body.moduleIds),
    actorId: req.user.id,
  });

  await ActivityLog.logActivity({ userId: req.user.id, action: 'created_team', module: 'teams', recordId: String(result.insertId) });
  res.status(201).json({ id: result.insertId, slug });
});

const updateTeam = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Team name is required' });

  const slug = await uniqueSlug('teams', slugify(req.body.slug || name), req.params.id);
  await pool.query('UPDATE teams SET name = ?, slug = ?, description = ?, icon = ?, color = ?, is_active = ? WHERE id = ?', [
    name,
    slug,
    req.body.description?.trim() || null,
    req.body.icon?.trim() || null,
    req.body.color?.trim() || '#4fc3f7',
    req.body.isActive !== false,
    req.params.id,
  ]);
  await setTeamModules({
    teamId: Number(req.params.id),
    moduleIds: sanitizeIds(req.body.moduleIds),
    actorId: req.user.id,
  });

  await ActivityLog.logActivity({ userId: req.user.id, action: 'updated_team', module: 'teams', recordId: String(req.params.id) });
  res.json({ id: Number(req.params.id), slug });
});

const archiveTeam = asyncHandler(async (req, res) => {
  await pool.query('UPDATE teams SET is_active = FALSE WHERE id = ?', [req.params.id]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'archived_team', module: 'teams', recordId: String(req.params.id) });
  res.json({ id: Number(req.params.id), isActive: false });
});

const deleteTeam = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM teams WHERE id = ?', [req.params.id]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'deleted_team', module: 'teams', recordId: String(req.params.id) });
  res.status(204).send();
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !roleId) {
    return res.status(400).json({ message: 'Name, email, password and role are required' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = await User.create({ name: name.trim(), email: email.trim(), phone: phone?.trim() || null, passwordHash, roleId: Number(roleId) });
  const user = await User.findById(id);
  res.status(201).json({ user: User.serialize(user) });
});

const addTeamMember = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password || !roleId) {
    return res.status(400).json({ message: 'Name, email, password and role are required' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = await User.create({ name: name.trim(), email: email.trim(), phone: phone?.trim() || null, passwordHash, roleId: Number(roleId) });
  await pool.query('INSERT INTO team_members (team_id, user_id, role_id, team_role) VALUES (?, ?, ?, ?)', [
    req.params.id,
    userId,
    roleId,
    req.body.teamRole || 'TEAM_MEMBER',
  ]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'added_member', module: 'teams', recordId: String(req.params.id), metadata: { memberUserId: userId } });
  res.status(201).json({ userId });
});

const updateTeamMember = asyncHandler(async (req, res) => {
  const { name, email, phone, roleId, isActive } = req.body;
  if (!name?.trim() || !email?.trim() || !roleId) {
    return res.status(400).json({ message: 'Name, email and role are required' });
  }

  await User.update(req.params.userId, {
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    roleId: Number(roleId),
    isActive: isActive !== false,
  });
  await pool.query('UPDATE team_members SET role_id = ?, team_role = ? WHERE team_id = ? AND user_id = ?', [
    roleId,
    req.body.teamRole || 'TEAM_MEMBER',
    req.params.id,
    req.params.userId,
  ]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'updated_member', module: 'teams', recordId: String(req.params.id), metadata: { memberUserId: Number(req.params.userId) } });
  res.json({ userId: Number(req.params.userId) });
});

const deactivateTeamMember = asyncHandler(async (req, res) => {
  await pool.query('UPDATE users SET is_active = FALSE WHERE id = ?', [req.params.userId]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'deactivated_member', module: 'teams', recordId: String(req.params.id), metadata: { memberUserId: Number(req.params.userId) } });
  res.json({ userId: Number(req.params.userId), isActive: false });
});

const resetTeamMemberPassword = asyncHandler(async (req, res) => {
  if (!req.body.password) return res.status(400).json({ message: 'Password is required' });
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  await User.updatePassword(req.params.userId, passwordHash);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'reset_member_password', module: 'teams', recordId: String(req.params.id), metadata: { memberUserId: Number(req.params.userId) } });
  res.json({ userId: Number(req.params.userId) });
});

const transferTeamMember = asyncHandler(async (req, res) => {
  const targetTeamId = Number(req.body.teamId);
  if (!targetTeamId) return res.status(400).json({ message: 'Target team is required' });

  await pool.query('UPDATE team_members SET team_id = ? WHERE team_id = ? AND user_id = ?', [targetTeamId, req.params.id, req.params.userId]);
  await ActivityLog.logActivity({
    userId: req.user.id,
    action: 'transferred_member',
    module: 'teams',
    recordId: String(req.params.id),
    metadata: { memberUserId: Number(req.params.userId), targetTeamId },
  });
  res.json({ userId: Number(req.params.userId), teamId: targetTeamId });
});

const removeTeamMember = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'removed_member', module: 'teams', recordId: String(req.params.id), metadata: { memberUserId: Number(req.params.userId) } });
  res.status(204).send();
});

const updateRolePermissions = asyncHandler(async (req, res) => {
  const permissionKeys = Array.from(new Set((Array.isArray(req.body.permissions) ? req.body.permissions : []).filter(Boolean)));
  const [permissions] = permissionKeys.length
    ? await pool.query('SELECT id, `key` FROM permissions WHERE `key` IN (?)', [permissionKeys])
    : [[]];

  await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.roleId]);
  if (permissions.length) {
    await pool.query(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
      [permissions.map((permission) => [Number(req.params.roleId), permission.id])]
    );
  }

  res.json({ roleId: Number(req.params.roleId), permissions: permissions.map((permission) => permission.key) });
});

const updateModule = asyncHandler(async (req, res) => {
  const [[existing]] = await pool.query('SELECT id FROM modules WHERE id = ? LIMIT 1', [req.params.moduleId]);
  if (!existing) return res.status(404).json({ message: 'Module not found' });
  const moduleName = req.body.name?.trim() || req.body.label?.trim();
  const moduleSlug = await uniqueSlug('modules', slugify(req.body.slug || moduleName), req.params.moduleId);

  await pool.query(
    `UPDATE modules
     SET name = ?, slug = ?, description = ?, label = ?, module_key = ?, permission_key = ?, route_key = ?, icon = ?, display_order = ?, active = ?
     WHERE id = ?`,
    [
      moduleName,
      moduleSlug,
      req.body.description?.trim() || null,
      req.body.label?.trim() || moduleName,
      moduleSlug,
      req.body.permissionKey || null,
      req.body.routeKey?.trim(),
      req.body.icon?.trim() || null,
      Number(req.body.displayOrder || 0),
      req.body.active !== false,
      req.params.moduleId,
    ]
  );

  res.json({ id: Number(req.params.moduleId) });
});

const createModule = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ message: 'Module name is required' });

  const slug = await uniqueSlug('modules', slugify(req.body.slug || name));
  const [result] = await pool.query(
    `INSERT INTO modules (name, slug, description, module_key, label, permission_key, route_key, icon, display_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
    [
      name,
      slug,
      req.body.description?.trim() || null,
      slug,
      name,
      req.body.permissionKey || null,
      req.body.routeKey?.trim() || slug,
      req.body.icon?.trim() || 'LayoutDashboard',
      Number(req.body.displayOrder || 500),
    ]
  );
  await ActivityLog.logActivity({ userId: req.user.id, action: 'created_module', module: 'modules', recordId: String(result.insertId) });
  res.status(201).json({ id: result.insertId, slug });
});

const deleteModule = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM modules WHERE id = ?', [req.params.moduleId]);
  await ActivityLog.logActivity({ userId: req.user.id, action: 'deleted_module', module: 'modules', recordId: String(req.params.moduleId) });
  res.status(204).send();
});

const impersonate = asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.userId);
  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target.role === 'SUPER_ADMIN') return res.status(400).json({ message: 'Super Admin accounts cannot be impersonated' });

  const [[membership]] = await pool.query(
    'SELECT id FROM team_members WHERE user_id = ? AND team_role = "TEAM_ADMIN" LIMIT 1',
    [target.id]
  );
  if (!membership && target.role !== 'ADMIN') {
    return res.status(400).json({ message: 'Only Team Admin or Admin dashboards can be impersonated' });
  }

  await ActivityLog.logActivity({
    userId: req.user.id,
    action: 'impersonation_started',
    module: 'users',
    recordId: String(target.id),
    metadata: { targetUserId: target.id, targetEmail: target.email },
  });

  res.json({
    token: signToken(target, { impersonatorId: req.user.id }),
    user: User.serialize(target),
    impersonatedBy: req.user.id,
  });
});

const activity = asyncHandler(async (req, res) => {
  const logs = await ActivityLog.list({ limit: req.query.limit || 80 });
  res.json({ activity: logs });
});

const getCmsControls = asyncHandler(async (_req, res) => {
  const settings = await Settings.get();
  const [[cmsControls]] = await pool.query('SELECT setting_value, updated_at FROM app_settings WHERE setting_key = "cms_controls" LIMIT 1');

  res.json({
    controls: parseJson(cmsControls?.setting_value, {
      homepage: {},
      hero: {},
      trailer: {},
      announcements: [],
      contact: settings.settings.contact,
      venue: { name: settings.settings.conference.venue },
      faq: [],
    }),
    settings: settings.settings,
    updatedAt: cmsControls?.updated_at || settings.updatedAt,
  });
});

const updateCmsControls = asyncHandler(async (req, res) => {
  const controls = req.body.controls || req.body || {};
  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES ('cms_controls', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [JSON.stringify(controls)]
  );
  res.json({ controls });
});

const pendingTasksForModules = async (modules) => {
  const permissionKeys = modules.map((module) => module.permissionKey).filter(Boolean);
  let total = 0;

  if (permissionKeys.includes('manage_registrations')) {
    const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM registrations WHERE registration_status = "pending"');
    total += number(row.total);
  }
  if (permissionKeys.includes('manage_abstracts')) {
    const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM abstracts WHERE status IN ("submitted", "under_review")');
    total += number(row.total);
  }
  if (permissionKeys.includes('analytics.view')) {
    const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM payments WHERE status IN ("created", "pending")');
    total += number(row.total);
  }

  return total;
};

module.exports = {
  activity,
  addTeamMember,
  archiveTeam,
  createModule,
  createTeam,
  createUser,
  dashboard,
  deactivateTeamMember,
  deleteModule,
  deleteTeam,
  getCmsControls,
  getTeam,
  impersonate,
  listTeams,
  metadata,
  removeTeamMember,
  resetTeamMemberPassword,
  transferTeamMember,
  updateCmsControls,
  updateTeamMember,
  updateModule,
  updateRolePermissions,
  updateTeam,
  visibleModules,
};
