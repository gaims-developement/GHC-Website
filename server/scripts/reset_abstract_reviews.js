require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function performReset() {
  const connection = await pool.getConnection();
  try {
    console.log('--- Step 1: Taking Snapshot Backup ---');
    const [abstracts] = await connection.query('SELECT * FROM abstracts');
    const [reviews] = await connection.query('SELECT * FROM abstract_reviews');
    const [assignments] = await connection.query('SELECT * FROM abstract_review_assignments');

    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `abstracts_backup_${timestamp}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          abstractsCount: abstracts.length,
          reviewsCount: reviews.length,
          assignmentsCount: assignments.length,
          abstracts,
          reviews,
          assignments,
        },
        null,
        2
      )
    );
    console.log(`Backup saved safely to: ${backupFile}`);
    console.log(`Total abstracts found: ${abstracts.length}`);
    console.log(`Total reviews to remove: ${reviews.length}`);
    console.log(`Total reviewer assignments to remove: ${assignments.length}`);

    console.log('\n--- Step 2: Beginning Database Reset Transaction ---');
    await connection.beginTransaction();

    // 1. Remove review scorecards
    const [delReviews] = await connection.query('DELETE FROM abstract_reviews');
    console.log(`Deleted ${delReviews.affectedRows} review scorecard(s).`);

    // 2. Remove reviewer assignments
    const [delAssignments] = await connection.query('DELETE FROM abstract_review_assignments');
    console.log(`Deleted ${delAssignments.affectedRows} reviewer assignment record(s).`);

    // 3. Reset abstract states, teams, and scores (keeping titles, authors, files intact)
    const [updAbstracts] = await connection.query(`
      UPDATE abstracts
      SET 
        team_id = NULL,
        workflow_stage = 'submitted',
        status = 'under_review',
        submission_status = 'under_review',
        final_score = NULL,
        review_score = NULL,
        review_notes = NULL,
        reviewer_id = NULL,
        lead_reviewer_id = NULL,
        lead_review_notes = NULL,
        lead_decision_at = NULL,
        reviewer_revision_notes = NULL,
        reviewer_recommended_action = NULL,
        reviewer_submitted_at = NULL
    `);
    console.log(`Reset ${updAbstracts.affectedRows} abstracts to 'submitted' / 'under_review' with 0 score and unassigned team.`);

    await connection.commit();
    console.log('\n✓ Transaction successfully committed!');

    // Verification check
    const [verifiedAbstracts] = await connection.query(
      'SELECT id, abstract_id, title, status, workflow_stage, team_id, final_score FROM abstracts'
    );
    console.log('\n--- Post-Reset Verification ---');
    console.table(verifiedAbstracts);
  } catch (err) {
    await connection.rollback();
    console.error('Error occurred, rolling back changes:', err);
    throw err;
  } finally {
    connection.release();
    process.exit(0);
  }
}

performReset();
