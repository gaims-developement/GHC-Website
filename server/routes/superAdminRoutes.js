const router = require('express').Router();
const {
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
} = require('../controllers/superAdminController');
const { requireAuth, requirePermission, requireRole } = require('../middleware/authMiddleware');

const superAdminOnly = requireRole('SUPER_ADMIN');

router.get('/modules', requireAuth, visibleModules);
router.get('/super-admin/dashboard', requireAuth, superAdminOnly, dashboard);
router.get('/super-admin/metadata', requireAuth, superAdminOnly, metadata);
router.get('/super-admin/activity', requireAuth, requirePermission('activity.view'), activity);
router.get('/super-admin/teams', requireAuth, requirePermission('teams.manage'), listTeams);
router.post('/super-admin/teams', requireAuth, requirePermission('teams.manage'), createTeam);
router.get('/super-admin/teams/:id', requireAuth, requirePermission('teams.manage'), getTeam);
router.put('/super-admin/teams/:id', requireAuth, requirePermission('teams.manage'), updateTeam);
router.patch('/super-admin/teams/:id/archive', requireAuth, requirePermission('teams.manage'), archiveTeam);
router.delete('/super-admin/teams/:id', requireAuth, requirePermission('teams.manage'), deleteTeam);
router.post('/super-admin/teams/:id/members', requireAuth, requirePermission('manage_team_members'), addTeamMember);
router.put('/super-admin/teams/:id/members/:userId', requireAuth, requirePermission('manage_team_members'), updateTeamMember);
router.patch('/super-admin/teams/:id/members/:userId/deactivate', requireAuth, requirePermission('manage_team_members'), deactivateTeamMember);
router.patch('/super-admin/teams/:id/members/:userId/password', requireAuth, requirePermission('manage_team_members'), resetTeamMemberPassword);
router.patch('/super-admin/teams/:id/members/:userId/transfer', requireAuth, requirePermission('manage_team_members'), transferTeamMember);
router.delete('/super-admin/teams/:id/members/:userId', requireAuth, requirePermission('manage_team_members'), removeTeamMember);
router.post('/super-admin/users', requireAuth, requirePermission('users.manage'), createUser);
router.put('/super-admin/roles/:roleId/permissions', requireAuth, requirePermission('users.manage'), updateRolePermissions);
router.post('/super-admin/modules', requireAuth, requirePermission('teams.manage'), createModule);
router.put('/super-admin/modules/:moduleId', requireAuth, requirePermission('teams.manage'), updateModule);
router.delete('/super-admin/modules/:moduleId', requireAuth, requirePermission('teams.manage'), deleteModule);
router.post('/super-admin/impersonate/:userId', requireAuth, requirePermission('impersonation.manage'), impersonate);
router.get('/super-admin/cms-controls', requireAuth, requirePermission('cms.manage'), getCmsControls);
router.put('/super-admin/cms-controls', requireAuth, requirePermission('cms.manage'), updateCmsControls);

module.exports = router;
