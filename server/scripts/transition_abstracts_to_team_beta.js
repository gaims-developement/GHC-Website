require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function transitionAbstracts() {
  const connection = await pool.getConnection();
  try {
    const abstractIds = [11, 13];
    const girikReviewerId = 5;
    const teamBetaId = 7;

    console.log(`Starting transition of abstracts ${abstractIds.join(', ')} to Team Beta (ID: ${teamBetaId})...`);

    // 1. Fetch current abstract & assignment records for backup
    const [abstracts] = await connection.query(
      'SELECT * FROM abstracts WHERE id IN (?)',
      [abstractIds]
    );
    const [assignments] = await connection.query(
      'SELECT * FROM abstract_review_assignments WHERE abstract_id IN (?)',
      [abstractIds]
    );

    // Save backup
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `abstracts_11_13_girik_transition_${timestamp}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          description: 'Transition of abstracts 11 and 13 from Girik direct reviewer assignment to Team Beta team lead jurisdiction',
          abstracts,
          assignments,
        },
        null,
        2
      )
    );
    console.log(`✓ Safety backup created: ${backupFile}`);

    // Begin transaction
    await connection.beginTransaction();

    // 2. Remove direct reviewer assignment to Girik
    const [delResult] = await connection.query(
      'DELETE FROM abstract_review_assignments WHERE abstract_id IN (?) AND reviewer_id = ?',
      [abstractIds, girikReviewerId]
    );
    console.log(`✓ Deleted ${delResult.affectedRows} direct assignment record(s) to reviewer ${girikReviewerId}.`);

    // 3. Update abstracts to be under Team Beta (workflow_stage = 'assigned_to_team', team_id = 7)
    const [updResult] = await connection.query(
      `UPDATE abstracts
       SET 
         team_id = ?,
         workflow_stage = 'assigned_to_team',
         reviewer_id = NULL
       WHERE id IN (?)`,
      [teamBetaId, abstractIds]
    );
    console.log(`✓ Updated ${updResult.affectedRows} abstract(s) with team_id = ${teamBetaId} and workflow_stage = 'assigned_to_team'.`);

    await connection.commit();
    console.log('✓ Transaction committed successfully.');

    // 4. Verification
    const [verified] = await connection.query(
      `SELECT a.id, a.abstract_id, a.title, a.status, a.workflow_stage, a.team_id, rt.name as team_name,
              (SELECT COUNT(*) FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id) as assigned_reviewers_count
       FROM abstracts a
       LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
       WHERE a.id IN (?)`,
      [abstractIds]
    );
    console.log('\n--- Post-Transition Verification ---');
    console.table(verified);

  } catch (error) {
    await connection.rollback();
    console.error('Error transitioning abstracts:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

transitionAbstracts();
