require('dotenv').config({ path: './.env' });
const { pool } = require('../config/db');

async function syncLeads() {
  console.log('=== Syncing Team Leads ===');
  
  // 1. Get role ID for SCIENTIFIC_TEAM_LEAD
  const [[leadRole]] = await pool.query("SELECT id FROM roles WHERE name = 'SCIENTIFIC_TEAM_LEAD' LIMIT 1");
  if (!leadRole) {
    console.error('SCIENTIFIC_TEAM_LEAD role not found!');
    process.exit(1);
  }
  console.log('SCIENTIFIC_TEAM_LEAD role id:', leadRole.id);

  // 2. Ensure permissions for SCIENTIFIC_TEAM_LEAD
  const permKeys = ['review_abstracts', 'assign_reviewers', 'manage_abstracts', 'manage_reviewers'];
  const [perms] = await pool.query("SELECT id, `key` FROM permissions WHERE `key` IN (?)", [permKeys]);
  for (const perm of perms) {
    await pool.query(
      "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
      [leadRole.id, perm.id]
    );
  }
  console.log('Verified permissions for SCIENTIFIC_TEAM_LEAD.');

  // 3. Find all users who are marked as LEAD in reviewer_team_members
  const [leads] = await pool.query(`
    SELECT rtm.team_id, rt.name AS team_name, rtm.reviewer_id, u.id AS user_id, u.name, u.email, u.role_id, ro.name AS current_role
    FROM reviewer_team_members rtm
    JOIN reviewer_teams rt ON rt.id = rtm.team_id
    JOIN reviewers r ON r.id = rtm.reviewer_id
    JOIN users u ON u.id = r.user_id
    JOIN roles ro ON ro.id = u.role_id
    WHERE rtm.designation = 'LEAD'
  `);

  console.log('Current designated leads in DB:', leads);

  for (const lead of leads) {
    if (lead.role_id !== 1 && lead.role_id !== 2 && lead.role_id !== leadRole.id) {
      await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [leadRole.id, lead.user_id]);
      console.log(`Updated user ${lead.name} (${lead.email}) to SCIENTIFIC_TEAM_LEAD.`);
    }
  }

  console.log('=== All leads synced successfully! ===');
  process.exit(0);
}

syncLeads().catch((err) => {
  console.error('Failed to sync leads:', err);
  process.exit(1);
});
