require('dotenv').config({ path: './.env' });
const { pool } = require('../config/db');

async function main() {
  console.log('=== Setting up SCIENTIFIC_TEAM_LEAD role and Gaurav Jayadev ===');

  // 1. Ensure SCIENTIFIC_TEAM_LEAD role exists
  let [[role]] = await pool.query("SELECT * FROM roles WHERE name = 'SCIENTIFIC_TEAM_LEAD'");
  if (!role) {
    const [insertResult] = await pool.query("INSERT INTO roles (name) VALUES ('SCIENTIFIC_TEAM_LEAD')");
    [[role]] = await pool.query("SELECT * FROM roles WHERE id = ?", [insertResult.insertId]);
    console.log('Created SCIENTIFIC_TEAM_LEAD role:', role);
  } else {
    console.log('SCIENTIFIC_TEAM_LEAD role already exists:', role);
  }

  // 2. Assign permissions to SCIENTIFIC_TEAM_LEAD
  const permKeys = ['review_abstracts', 'assign_reviewers', 'manage_abstracts'];
  const [perms] = await pool.query("SELECT id, `key` FROM permissions WHERE `key` IN (?)", [permKeys]);
  console.log('Found permissions:', perms);

  for (const perm of perms) {
    await pool.query(
      "INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
      [role.id, perm.id]
    );
  }
  console.log('Assigned permissions to SCIENTIFIC_TEAM_LEAD.');

  // 3. Update Gaurav Jayadev user
  await pool.query("UPDATE users SET role_id = ? WHERE email = 'gauravjayadev@gmail.com'", [role.id]);
  const [[gauravUser]] = await pool.query("SELECT id, name, email, role_id FROM users WHERE email = 'gauravjayadev@gmail.com'");
  console.log('Updated Gaurav user:', gauravUser);

  // 4. Check Gaurav reviewer record
  let [[reviewer]] = await pool.query("SELECT * FROM reviewers WHERE user_id = ?", [gauravUser.id]);
  if (!reviewer) {
    const [revInsert] = await pool.query(
      "INSERT INTO reviewers (user_id, designation, status) VALUES (?, 'Team Alpha Core Lead', 'active')",
      [gauravUser.id]
    );
    [[reviewer]] = await pool.query("SELECT * FROM reviewers WHERE id = ?", [revInsert.insertId]);
  } else {
    await pool.query("UPDATE reviewers SET designation = 'Team Alpha Core Lead', status = 'active' WHERE id = ?", [reviewer.id]);
  }
  console.log('Gaurav reviewer record:', reviewer);

  // 5. Ensure Team Alpha exists
  let [[teamAlpha]] = await pool.query("SELECT * FROM reviewer_teams WHERE name = 'Team Alpha'");
  if (!teamAlpha) {
    const [tInsert] = await pool.query("INSERT INTO reviewer_teams (name) VALUES ('Team Alpha')");
    [[teamAlpha]] = await pool.query("SELECT * FROM reviewer_teams WHERE id = ?", [tInsert.insertId]);
  }
  console.log('Team Alpha:', teamAlpha);

  // 6. Ensure Gaurav is LEAD of Team Alpha
  const [[membership]] = await pool.query(
    "SELECT * FROM reviewer_team_members WHERE team_id = ? AND reviewer_id = ?",
    [teamAlpha.id, reviewer.id]
  );
  if (!membership) {
    await pool.query(
      "INSERT INTO reviewer_team_members (team_id, reviewer_id, designation) VALUES (?, ?, 'LEAD')",
      [teamAlpha.id, reviewer.id]
    );
    console.log('Inserted Gaurav as LEAD of Team Alpha.');
  } else {
    await pool.query(
      "UPDATE reviewer_team_members SET designation = 'LEAD' WHERE id = ?",
      [membership.id]
    );
    console.log('Confirmed Gaurav as LEAD of Team Alpha.');
  }

  console.log('=== Setup complete! ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Error in setup:', err);
  process.exit(1);
});
