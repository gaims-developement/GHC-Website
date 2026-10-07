const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const asyncHandler = require('../utils/asyncHandler');

const TEAM_NAME_MAX_LENGTH = 150;
const DESIGNATIONS = new Set(['LEAD', 'MEMBER']);

const cleanTeamName = (value) => String(value || '').trim();
const cleanDescription = (value) => {
  const description = String(value || '').trim();
  return description || null;
};
const normalizeDesignation = (value) => String(value || 'MEMBER').trim().toUpperCase();

const writeAudit = async (req, connection, { action, teamId, reviewerId = null, oldValues = null, newValues = null }) => {
  const metadata = { teamId: Number(teamId), reviewerId: reviewerId ? Number(reviewerId) : null, oldValues, newValues };
  await connection.query(
    `INSERT INTO audit_logs
      (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
     VALUES (?, ?, 'scientific', 'reviewer_team', ?, ?, ?, ?, ?)`,
    [
      req.user?.id || null,
      action,
      String(teamId),
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      req.ip || null,
      req.get('user-agent') || null,
    ]
  );
  await ActivityLog.logActivity({
    userId: req.user?.id || null,
    action,
    module: 'scientific',
    recordId: String(teamId),
    metadata,
  }).catch(() => {});
};

const mapTeamRows = (teams, members) => {
  const membersByTeam = new Map();
  members.forEach((member) => {
    const teamMembers = membersByTeam.get(member.team_id) || [];
    teamMembers.push(member);
    membersByTeam.set(member.team_id, teamMembers);
  });
  return teams.map((team) => ({
    ...team,
    member_count: Number(team.member_count || 0),
    members: membersByTeam.get(team.id) || [],
  }));
};

const fetchMembers = async (connection, teamId = null) => {
  const params = teamId ? [teamId] : [];
  const where = teamId ? 'WHERE rtm.team_id = ?' : '';
  const [members] = await connection.query(
    `SELECT rtm.id AS membership_id, rtm.team_id, rtm.reviewer_id, rtm.designation,
            rtm.created_at AS assigned_at, rtm.updated_at,
            u.id AS user_id, u.name, u.email, r.institution, r.country, r.status
     FROM reviewer_team_members rtm
     INNER JOIN reviewers r ON r.id = rtm.reviewer_id
     INNER JOIN users u ON u.id = r.user_id
     ${where}
     ORDER BY rtm.team_id ASC, FIELD(rtm.designation, 'LEAD', 'MEMBER'), rtm.created_at ASC, rtm.id ASC`,
    params
  );
  return members;
};

const listTeams = asyncHandler(async (_req, res) => {
  const [teams] = await pool.query(
    `SELECT rt.*, COUNT(rtm.id) AS member_count
     FROM reviewer_teams rt
     LEFT JOIN reviewer_team_members rtm ON rtm.team_id = rt.id
     GROUP BY rt.id
     ORDER BY rt.created_at ASC, rt.id ASC`
  );
  const members = await fetchMembers(pool);
  res.json({ teams: mapTeamRows(teams, members) });
});

const createTeam = asyncHandler(async (req, res) => {
  const name = cleanTeamName(req.body.name);
  if (!name) return res.status(400).json({ message: 'Team name is required.' });
  if (name.length > TEAM_NAME_MAX_LENGTH) return res.status(400).json({ message: `Team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer.` });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO reviewer_teams (name, description, created_by) VALUES (?, ?, ?)',
      [name, cleanDescription(req.body.description), req.user?.id || null]
    );
    const team = { id: result.insertId, name, description: cleanDescription(req.body.description) };
    await writeAudit(req, connection, { action: 'reviewer_team_created', teamId: team.id, newValues: team });
    await connection.commit();
    res.status(201).json({ team: { ...team, member_count: 0, members: [] } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A reviewer team with this name already exists.' });
    throw error;
  } finally {
    connection.release();
  }
});

const updateTeam = asyncHandler(async (req, res) => {
  const teamId = Number(req.params.id);
  const name = cleanTeamName(req.body.name);
  if (!name) return res.status(400).json({ message: 'Team name is required.' });
  if (name.length > TEAM_NAME_MAX_LENGTH) return res.status(400).json({ message: `Team name must be ${TEAM_NAME_MAX_LENGTH} characters or fewer.` });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[current]] = await connection.query('SELECT * FROM reviewer_teams WHERE id = ? FOR UPDATE', [teamId]);
    if (!current) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reviewer team not found.' });
    }
    const description = req.body.description !== undefined ? cleanDescription(req.body.description) : current.description;
    await connection.query('UPDATE reviewer_teams SET name = ?, description = ? WHERE id = ?', [name, description, teamId]);
    await writeAudit(req, connection, {
      action: current.name === name ? 'reviewer_team_updated' : 'reviewer_team_renamed',
      teamId,
      oldValues: { name: current.name, description: current.description },
      newValues: { name, description },
    });
    await connection.commit();
    res.json({ team: { ...current, name, description } });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'A reviewer team with this name already exists.' });
    throw error;
  } finally {
    connection.release();
  }
});

const deleteTeam = asyncHandler(async (req, res) => {
  const teamId = Number(req.params.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[team]] = await connection.query('SELECT * FROM reviewer_teams WHERE id = ? FOR UPDATE', [teamId]);
    if (!team) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reviewer team not found.' });
    }
    const [[countRow]] = await connection.query('SELECT COUNT(*) AS count FROM reviewer_team_members WHERE team_id = ?', [teamId]);
    if (Number(countRow.count) > 0) {
      await connection.rollback();
      return res.status(409).json({ message: 'Remove all reviewers from this team before deleting it.', code: 'TEAM_NOT_EMPTY' });
    }
    await connection.query('DELETE FROM reviewer_teams WHERE id = ?', [teamId]);
    await writeAudit(req, connection, { action: 'reviewer_team_deleted', teamId, oldValues: { name: team.name, description: team.description } });
    await connection.commit();
    res.status(204).send();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

const listTeamMembers = asyncHandler(async (req, res) => {
  const teamId = Number(req.params.id);
  const [[team]] = await pool.query('SELECT * FROM reviewer_teams WHERE id = ?', [teamId]);
  if (!team) return res.status(404).json({ message: 'Reviewer team not found.' });
  res.json({ team, members: await fetchMembers(pool, teamId) });
});

const saveMembership = async (req, res, { sourceTeamId = null } = {}) => {
  const destinationTeamId = Number(req.body.teamId || req.body.team_id || sourceTeamId);
  const reviewerId = Number(req.body.reviewerId || req.body.reviewer_id || req.params.reviewerId);
  const designation = normalizeDesignation(req.body.designation);
  const replaceLead = req.body.replaceLead === true || req.body.replace_lead === true;

  if (!destinationTeamId || !reviewerId) return res.status(400).json({ message: 'Team and reviewer are required.' });
  if (!DESIGNATIONS.has(designation)) return res.status(400).json({ message: 'Designation must be LEAD or MEMBER.' });

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[team]] = await connection.query('SELECT id, name FROM reviewer_teams WHERE id = ? FOR UPDATE', [destinationTeamId]);
    if (!team) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reviewer team not found.' });
    }
    const [[reviewer]] = await connection.query(
      `SELECT r.id, r.status, u.name, u.email, u.is_active
       FROM reviewers r INNER JOIN users u ON u.id = r.user_id
       WHERE r.id = ? FOR UPDATE`,
      [reviewerId]
    );
    if (!reviewer) {
      await connection.rollback();
      return res.status(404).json({ message: 'Reviewer not found or the selected user is not a reviewer.' });
    }
    if (!reviewer.is_active) {
      await connection.rollback();
      return res.status(400).json({ message: 'The selected reviewer account is inactive.' });
    }

    const [[existingMembership]] = await connection.query(
      `SELECT rtm.*, rt.name AS team_name
       FROM reviewer_team_members rtm INNER JOIN reviewer_teams rt ON rt.id = rtm.team_id
       WHERE rtm.reviewer_id = ? FOR UPDATE`,
      [reviewerId]
    );
    if (sourceTeamId && existingMembership && Number(existingMembership.team_id) !== Number(sourceTeamId)) {
      await connection.rollback();
      return res.status(409).json({ message: 'Reviewer membership changed. Refresh the teams and try again.' });
    }

    let existingLead = null;
    if (designation === 'LEAD') {
      [[existingLead]] = await connection.query(
        `SELECT rtm.reviewer_id, u.name
         FROM reviewer_team_members rtm
         INNER JOIN reviewers r ON r.id = rtm.reviewer_id
         INNER JOIN users u ON u.id = r.user_id
         WHERE rtm.team_id = ? AND rtm.designation = 'LEAD' AND rtm.reviewer_id <> ?
         FOR UPDATE`,
        [destinationTeamId, reviewerId]
      );
      if (existingLead && !replaceLead) {
        await connection.rollback();
        return res.status(409).json({
          message: `${team.name} already has a Lead.`,
          code: 'TEAM_LEAD_EXISTS',
          currentLead: existingLead,
        });
      }
      if (existingLead) {
        await connection.query(
          "UPDATE reviewer_team_members SET designation = 'MEMBER' WHERE team_id = ? AND reviewer_id = ?",
          [destinationTeamId, existingLead.reviewer_id]
        );
      }
    }

    if (existingMembership) {
      await connection.query(
        'UPDATE reviewer_team_members SET team_id = ?, designation = ? WHERE reviewer_id = ?',
        [destinationTeamId, designation, reviewerId]
      );
    } else {
      await connection.query(
        'INSERT INTO reviewer_team_members (team_id, reviewer_id, designation) VALUES (?, ?, ?)',
        [destinationTeamId, reviewerId, designation]
      );
    }

    // Sync user role for LEAD designation
    if (designation === 'LEAD') {
      const [[leadRole]] = await connection.query("SELECT id FROM roles WHERE name = 'SCIENTIFIC_TEAM_LEAD' LIMIT 1");
      if (leadRole) {
        await connection.query(
          "UPDATE users SET role_id = ? WHERE id = (SELECT user_id FROM reviewers WHERE id = ?) AND role_id NOT IN (1, 2)",
          [leadRole.id, reviewerId]
        );
      }
    } else if (existingMembership && existingMembership.designation === 'LEAD' && designation === 'MEMBER') {
      const [[revRole]] = await connection.query("SELECT id FROM roles WHERE name IN ('SCIENTIFIC_REVIEWER', 'REVIEWER') ORDER BY id DESC LIMIT 1");
      if (revRole) {
        await connection.query(
          "UPDATE users SET role_id = ? WHERE id = (SELECT user_id FROM reviewers WHERE id = ?) AND role_id NOT IN (1, 2)",
          [revRole.id, reviewerId]
        );
      }
    }
    if (existingLead) {
      const [[revRole]] = await connection.query("SELECT id FROM roles WHERE name IN ('SCIENTIFIC_REVIEWER', 'REVIEWER') ORDER BY id DESC LIMIT 1");
      if (revRole) {
        await connection.query(
          "UPDATE users SET role_id = ? WHERE id = (SELECT user_id FROM reviewers WHERE id = ?) AND role_id NOT IN (1, 2)",
          [revRole.id, existingLead.reviewer_id]
        );
      }
    }

    const moved = existingMembership && Number(existingMembership.team_id) !== destinationTeamId;
    const designationChanged = existingMembership && existingMembership.designation !== designation;
    const action = existingLead
      ? 'reviewer_team_lead_replaced'
      : moved
        ? 'reviewer_moved_between_teams'
        : designationChanged
          ? 'reviewer_team_designation_changed'
          : existingMembership
            ? 'reviewer_team_membership_updated'
            : 'reviewer_added_to_team';
    await writeAudit(req, connection, {
      action,
      teamId: destinationTeamId,
      reviewerId,
      oldValues: existingMembership
        ? { teamId: existingMembership.team_id, teamName: existingMembership.team_name, designation: existingMembership.designation }
        : null,
      newValues: { teamId: destinationTeamId, teamName: team.name, designation, replacedLeadReviewerId: existingLead?.reviewer_id || null },
    });
    await connection.commit();
    res.status(existingMembership ? 200 : 201).json({
      membership: { team_id: destinationTeamId, reviewer_id: reviewerId, designation },
      replacedLead: existingLead || null,
    });
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: designation === 'LEAD' ? `${team?.name || 'This team'} already has a Lead.` : 'Reviewer already has an active team membership.',
        code: designation === 'LEAD' ? 'TEAM_LEAD_EXISTS' : 'DUPLICATE_TEAM_MEMBERSHIP',
      });
    }
    throw error;
  } finally {
    connection.release();
  }
};

const addTeamMember = asyncHandler((req, res) => saveMembership(req, res, { sourceTeamId: Number(req.params.id) }));
const updateTeamMember = asyncHandler((req, res) => saveMembership(req, res, { sourceTeamId: Number(req.params.id) }));

const removeTeamMember = asyncHandler(async (req, res) => {
  const teamId = Number(req.params.id);
  const reviewerId = Number(req.params.reviewerId);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[membership]] = await connection.query(
      `SELECT rtm.*, rt.name AS team_name, u.name AS reviewer_name
       FROM reviewer_team_members rtm
       INNER JOIN reviewer_teams rt ON rt.id = rtm.team_id
       INNER JOIN reviewers r ON r.id = rtm.reviewer_id
       INNER JOIN users u ON u.id = r.user_id
       WHERE rtm.team_id = ? AND rtm.reviewer_id = ? FOR UPDATE`,
      [teamId, reviewerId]
    );
    if (!membership) {
      await connection.rollback();
      return res.status(404).json({ message: 'Team membership not found.' });
    }
    await connection.query('DELETE FROM reviewer_team_members WHERE team_id = ? AND reviewer_id = ?', [teamId, reviewerId]);
    await writeAudit(req, connection, {
      action: 'reviewer_removed_from_team',
      teamId,
      reviewerId,
      oldValues: { teamId, teamName: membership.team_name, designation: membership.designation, reviewerName: membership.reviewer_name },
    });
    await connection.commit();
    res.status(204).send();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

module.exports = {
  addTeamMember,
  createTeam,
  deleteTeam,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
  updateTeamMember,
};
