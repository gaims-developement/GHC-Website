require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

// Abstracts 15 & 17 were assigned directly to Girik (reviewer 5) instead of his team.
// Move them under Team Beta so Girik, as Team Lead, can distribute them to members.
async function transitionAbstracts() {
  const connection = await pool.getConnection();
  try {
    const abstractIds = [15, 17];
    const girikReviewerId = 5;
    const teamBetaId = 7;
    const expectedTitles = {
      15: 'Bacteriologycal profil of urinary tract infection',
      17: 'Distal Renal Tubular Acidosis Presenting With Rickets',
    };

    const [abstracts] = await connection.query('SELECT * FROM abstracts WHERE id IN (?)', [abstractIds]);
    const [assignments] = await connection.query('SELECT * FROM abstract_review_assignments WHERE abstract_id IN (?)', [abstractIds]);
    const [reviews] = await connection.query('SELECT id FROM abstract_reviews WHERE abstract_id IN (?)', [abstractIds]);

    // Safety checks: refuse to run if the data is not exactly what we expect.
    if (abstracts.length !== abstractIds.length) throw new Error('Expected abstracts not found');
    for (const a of abstracts) {
      if (!String(a.title).startsWith(expectedTitles[a.id])) throw new Error(`Title mismatch for abstract ${a.id}: ${a.title}`);
      if (a.team_id !== null) throw new Error(`Abstract ${a.id} is already in team ${a.team_id}`);
      if (['accepted', 'rejected'].includes(a.status)) throw new Error(`Abstract ${a.id} already has a final decision`);
    }
    if (assignments.some((x) => x.reviewer_id !== girikReviewerId)) throw new Error('Unexpected reviewer assignments found');
    if (reviews.length) throw new Error('Reviews already submitted; aborting');

    const backupDir = path.join(__dirname, '..', 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `abstracts_15_17_girik_team_beta_transition_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      description: 'Transition of abstracts 15 and 17 from Girik direct reviewer assignment to Team Beta team lead jurisdiction',
      abstracts,
      assignments,
    }, null, 2));
    console.log(`✓ Safety backup created: ${backupFile}`);

    await connection.beginTransaction();

    const [delResult] = await connection.query(
      'DELETE FROM abstract_review_assignments WHERE abstract_id IN (?) AND reviewer_id = ?',
      [abstractIds, girikReviewerId]
    );
    console.log(`✓ Deleted ${delResult.affectedRows} direct assignment record(s) to reviewer ${girikReviewerId}.`);

    const [updResult] = await connection.query(
      `UPDATE abstracts
       SET team_id = ?, workflow_stage = 'assigned_to_team', reviewer_id = NULL, lead_reviewer_id = NULL
       WHERE id IN (?)`,
      [teamBetaId, abstractIds]
    );
    if (updResult.affectedRows !== abstractIds.length) throw new Error('Unexpected number of abstracts updated');
    console.log(`✓ Updated ${updResult.affectedRows} abstract(s) to Team Beta (team_id = ${teamBetaId}), stage 'assigned_to_team'.`);

    await connection.commit();
    console.log('✓ Transaction committed successfully.');

    const [verified] = await connection.query(
      `SELECT a.id, a.abstract_id, LEFT(a.title, 60) AS title, a.status, a.workflow_stage, rt.name AS team_name,
              (SELECT COUNT(*) FROM abstract_review_assignments ara WHERE ara.abstract_id = a.id) AS assigned_reviewers_count
       FROM abstracts a LEFT JOIN reviewer_teams rt ON rt.id = a.team_id
       WHERE a.id IN (?)`,
      [abstractIds]
    );
    console.log('\n--- Post-Transition Verification ---');
    console.table(verified);
  } catch (error) {
    await connection.rollback().catch(() => {});
    console.error('Error transitioning abstracts (no changes committed):', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

transitionAbstracts();
