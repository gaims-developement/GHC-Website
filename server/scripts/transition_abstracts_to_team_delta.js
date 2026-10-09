require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function transitionAbstractsToTeamDelta() {
  const connection = await pool.getConnection();
  try {
    const abstractIds = [10, 14];
    const yousraReviewerId = 3;
    const teamDeltaId = 8;

    console.log(`Starting safe transition of abstracts ${abstractIds.join(', ')} to Team Delta (ID: ${teamDeltaId})...`);

    // 0. Sanity checks: Verify reviewer Yousra and Team Delta
    const [[reviewer]] = await connection.query(
      `SELECT r.id AS reviewer_id, u.id AS user_id, u.name, u.email, rtm.team_id, rt.name AS team_name, rtm.designation
       FROM reviewers r
       JOIN users u ON u.id = r.user_id
       LEFT JOIN reviewer_team_members rtm ON rtm.reviewer_id = r.id
       LEFT JOIN reviewer_teams rt ON rt.id = rtm.team_id
       WHERE r.id = ?`,
      [yousraReviewerId]
    );

    if (!reviewer) {
      throw new Error(`Reviewer with ID ${yousraReviewerId} not found.`);
    }

    const [[team]] = await connection.query(
      'SELECT id, name FROM reviewer_teams WHERE id = ?',
      [teamDeltaId]
    );

    if (!team) {
      throw new Error(`Team with ID ${teamDeltaId} not found.`);
    }

    console.log(`✓ Verified Reviewer: ${reviewer.name} (${reviewer.email}), Reviewer ID: ${reviewer.reviewer_id}`);
    console.log(`✓ Verified Target Team: ${team.name} (ID: ${team.id})`);

    // 1. Fetch current abstract and assignment records for snapshot backup
    const [abstracts] = await connection.query(
      'SELECT * FROM abstracts WHERE id IN (?)',
      [abstractIds]
    );

    if (abstracts.length !== abstractIds.length) {
      throw new Error(`Expected ${abstractIds.length} abstracts, but found ${abstracts.length}.`);
    }

    const [assignments] = await connection.query(
      'SELECT * FROM abstract_review_assignments WHERE abstract_id IN (?)',
      [abstractIds]
    );

    // Save backup file
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `abstracts_10_14_yousra_team_delta_transition_${timestamp}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          description: 'Transition of abstracts 10 and 14 from direct assignment (Dr. Yousra Iftequar) to her team (Team Delta, ID 8)',
          reviewer,
          team,
          abstracts,
          assignments,
        },
        null,
        2
      )
    );
    console.log(`✓ Safety snapshot backup created: ${backupFile}`);

    // 2. Begin transaction
    await connection.beginTransaction();

    // 3. Remove direct reviewer assignment to Yousra
    const [delResult] = await connection.query(
      'DELETE FROM abstract_review_assignments WHERE abstract_id IN (?) AND reviewer_id = ?',
      [abstractIds, yousraReviewerId]
    );
    console.log(`✓ Deleted ${delResult.affectedRows} direct assignment record(s) to reviewer ${yousraReviewerId}.`);

    // 4. Update abstracts: assign to Team Delta (team_id = 8, workflow_stage = 'assigned_to_team', reviewer_id = NULL)
    const [updResult] = await connection.query(
      `UPDATE abstracts
       SET 
         team_id = ?,
         workflow_stage = 'assigned_to_team',
         reviewer_id = NULL,
         lead_reviewer_id = NULL
       WHERE id IN (?)`,
      [teamDeltaId, abstractIds]
    );
    console.log(`✓ Updated ${updResult.affectedRows} abstract(s) with team_id = ${teamDeltaId} and workflow_stage = 'assigned_to_team'.`);

    // 5. Insert audit and activity logs
    for (const abs of abstracts) {
      const oldVals = {
        team_id: abs.team_id,
        workflow_stage: abs.workflow_stage,
        reviewer_id: abs.reviewer_id,
        assigned_reviewer_id: yousraReviewerId,
      };
      const newVals = {
        team_id: teamDeltaId,
        workflow_stage: 'assigned_to_team',
        reviewer_id: null,
      };

      await connection.query(
        `INSERT INTO audit_logs
          (user_id, action, module, record_type, record_id, old_values, new_values)
         VALUES (?, ?, 'scientific', 'abstract', ?, ?, ?)`,
        [
          reviewer.user_id,
          'ASSIGN_ABSTRACT_TEAM',
          String(abs.id),
          JSON.stringify(oldVals),
          JSON.stringify(newVals),
        ]
      );

      await connection.query(
        `INSERT INTO activity_logs (user_id, action, module, record_id, metadata)
         VALUES (?, 'assigned_abstract_team', 'scientific', ?, ?)`,
        [
          reviewer.user_id,
          String(abs.id),
          JSON.stringify({ teamId: teamDeltaId, previousReviewerId: yousraReviewerId }),
        ]
      );
    }
    console.log(`✓ Inserted audit and activity log entries for abstracts ${abstractIds.join(', ')}.`);

    // 6. Commit transaction
    await connection.commit();
    console.log('✓ Database transaction successfully committed.');

    // 7. Post-transition verification
    const [verified] = await connection.query(
      `SELECT a.id, a.abstract_id, a.title, a.status, a.workflow_stage, a.team_id, rt.name AS team_name,
              (SELECT COUNT(*) FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id) AS assigned_reviewers_count
       FROM abstracts a
       LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
       WHERE a.id IN (?)`,
      [abstractIds]
    );
    console.log('\n--- Post-Transition Verification ---');
    console.table(verified);

    // 8. Verify Team Delta workspace visibility
    const [deltaQueue] = await connection.query(
      `SELECT a.id, a.abstract_id, a.title, a.workflow_stage, a.team_id
       FROM abstracts a
       WHERE a.team_id = ?`,
      [teamDeltaId]
    );
    console.log(`\n--- Abstracts now in Team Delta (ID: ${teamDeltaId}) queue: ${deltaQueue.length} ---`);
    console.table(deltaQueue);

  } catch (error) {
    await connection.rollback();
    console.error('Error transitioning abstracts, transaction rolled back:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

transitionAbstractsToTeamDelta();
