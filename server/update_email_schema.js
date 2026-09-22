require('dotenv').config();
const { pool } = require('./config/db');

async function updateSchema() {
  console.log("Updating email schema...");
  try {
    // Add error_message column to email_logs
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_logs' AND COLUMN_NAME = 'error_message'
    `);
    
    if (columns.length === 0) {
      await pool.query('ALTER TABLE email_logs ADD COLUMN error_message TEXT NULL');
      console.log("Added error_message column to email_logs.");
    } else {
      console.log("error_message column already exists in email_logs.");
    }

    // Insert test_email template
    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'test_email',
        'GHC SMTP Test Email',
        'This is a test email from the Global Health Conclave email system. If you received this email, SMTP delivery is working correctly.',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);
    
    // Insert abstract_revision template
    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'abstract_revision',
        'Revision Requested for {{title}}',
        'Please upload your revised abstract here: {{link}}',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);

    console.log("Email templates inserted.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    process.exit(0);
  }
}

updateSchema();
