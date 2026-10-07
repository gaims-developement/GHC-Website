require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function rollbackReview() {
  const connection = await pool.getConnection();
  try {
    const targetTitle = '%Assessment of C-Reactive Protein Levels in Patients with Type 2 Diabetes Mellitus and Its Correlation with Radiologically Diagnosed Grade 1 Fatty Liver%';
    
    // Find the abstract
    const [abstracts] = await connection.query(
      'SELECT * FROM abstracts WHERE title LIKE ?',
      [targetTitle]
    );

    if (abstracts.length === 0) {
      throw new Error('Target abstract not found in database.');
    }

    const abstract = abstracts[0];
    const abstractId = abstract.id;
    console.log(`Found abstract ID: ${abstractId} (${abstract.abstract_id}) - "${abstract.title}"`);

    // Fetch related records for backup
    const [reviews] = await connection.query(
      'SELECT * FROM abstract_reviews WHERE abstract_id = ?',
      [abstractId]
    );
    const [assignments] = await connection.query(
      'SELECT * FROM abstract_review_assignments WHERE abstract_id = ?',
      [abstractId]
    );

    // Backup
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `abstract_${abstractId}_rollback_backup_${timestamp}.json`);
    fs.writeFileSync(
      backupFile,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          abstract,
          reviews,
          assignments,
        },
        null,
        2
      )
    );
    console.log(`Backup saved to: ${backupFile}`);

    // Begin transaction
    await connection.beginTransaction();

    // 1. Delete reviews
    const [delReviews] = await connection.query(
      'DELETE FROM abstract_reviews WHERE abstract_id = ?',
      [abstractId]
    );
    console.log(`Deleted ${delReviews.affectedRows} review(s) for abstract ${abstractId}.`);

    // 2. Delete assignments
    const [delAssignments] = await connection.query(
      'DELETE FROM abstract_review_assignments WHERE abstract_id = ?',
      [abstractId]
    );
    console.log(`Deleted ${delAssignments.affectedRows} reviewer assignment(s) for abstract ${abstractId}.`);

    // 3. Reset abstract status, team, scores, and workflow stage to unassigned & submitted
    const [updAbstract] = await connection.query(
      `UPDATE abstracts
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
       WHERE id = ?`,
      [abstractId]
    );
    console.log(`Updated abstract ${abstractId} (affected rows: ${updAbstract.affectedRows}).`);

    await connection.commit();
    console.log('✓ Transaction committed successfully.');

    // Verification
    const [verifiedAbstract] = await connection.query(
      'SELECT id, abstract_id, title, status, submission_status, workflow_stage, team_id, final_score, review_score, reviewer_id FROM abstracts WHERE id = ?',
      [abstractId]
    );
    const [verifiedReviews] = await connection.query(
      'SELECT * FROM abstract_reviews WHERE abstract_id = ?',
      [abstractId]
    );
    const [verifiedAssignments] = await connection.query(
      'SELECT * FROM abstract_review_assignments WHERE abstract_id = ?',
      [abstractId]
    );

    console.log('\n--- Verification ---');
    console.log('Abstract State:', verifiedAbstract[0]);
    console.log('Remaining Reviews:', verifiedReviews.length);
    console.log('Remaining Assignments:', verifiedAssignments.length);

  } catch (error) {
    await connection.rollback();
    console.error('Error rolling back abstract review:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

rollbackReview();
