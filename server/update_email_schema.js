require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { pool } = require('./config/db');

const abstractAcceptedTemplate = `<!doctype html>
<html>
<body style="margin:0; padding:0; background:#f1f5f9; font-family: Arial, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; box-shadow:0 12px 28px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#081B33 0%,#173B8F 58%,#00A6A6 100%); padding:30px 28px; text-align:center;">
          <div style="display:inline-block; padding:5px 14px; border-radius:999px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); color:#ffffff; font-size:11px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase;">GHC 2026 Scientific Committee</div>
          <h1 style="margin:14px 0 4px; color:#ffffff; font-size:25px; line-height:1.2;">Abstract Accepted</h1>
          <p style="margin:0; color:#c7f9f1; font-size:14px;">Global Healthcare Conclave 2026</p>
        </td></tr>
        <tr><td style="padding:30px 30px 10px; text-align:center;">
          <div style="display:inline-block; padding:7px 16px; border-radius:999px; background:#ecfdf5; border:1px solid #a7f3d0; color:#047857; font-size:12px; font-weight:800; letter-spacing:.4px; text-transform:uppercase;">Accepted for Presentation</div>
          <h2 style="margin:18px 0 8px; color:#0f172a; font-size:22px; line-height:1.3;">Congratulations, {{fullName}}</h2>
          <p style="margin:0; color:#475569; font-size:15px; line-height:1.6;">Your abstract has been accepted for the GHC 2026 research program.</p>
        </td></tr>
        <tr><td style="padding:18px 30px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px;">
            <p style="margin:0 0 6px; color:#64748b; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Abstract Details</p>
            <h3 style="margin:0 0 14px; color:#0f172a; font-size:18px; line-height:1.35;">{{abstractTitle}}</h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px; color:#334155;">
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Abstract Code</td><td style="padding:6px 0; text-align:right; font-weight:800; color:#173B8F;">{{abstractCode}}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Category</td><td style="padding:6px 0; text-align:right; font-weight:700;">{{category}}</td></tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:0 30px 22px;">
          <div style="background:#f0fdf4; border-left:4px solid #10b981; border-radius:10px; padding:16px;">
            <p style="margin:0 0 6px; color:#065f46; font-size:12px; font-weight:800; text-transform:uppercase;">Committee Notes</p>
            <p style="margin:0; color:#334155; font-size:14px; line-height:1.6; white-space:pre-wrap;">{{reviewComments}}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 30px 30px;"><p style="margin:0; color:#475569; font-size:14px; line-height:1.7;">Further presentation format, schedule, and onsite instructions will be shared by the GHC Scientific Committee.</p></td></tr>
        <tr><td style="background:#081B33; padding:22px 30px; text-align:center;">
          <p style="margin:0 0 6px; color:#ffffff; font-size:13px; font-weight:800;">Global Healthcare Conclave 2026</p>
          <p style="margin:0; color:#94a3b8; font-size:12px;">For assistance, contact <a href="mailto:{{contactEmail}}" style="color:#38bdf8; text-decoration:none;">{{contactEmail}}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const abstractRejectedTemplate = `<!doctype html>
<html>
<body style="margin:0; padding:0; background:#f1f5f9; font-family: Arial, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9; padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px; overflow:hidden; box-shadow:0 12px 28px rgba(15,23,42,0.08);">
        <tr><td style="background:linear-gradient(135deg,#081B33 0%,#173B8F 58%,#e244b7 100%); padding:30px 28px; text-align:center;">
          <div style="display:inline-block; padding:5px 14px; border-radius:999px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); color:#ffffff; font-size:11px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase;">GHC 2026 Scientific Committee</div>
          <h1 style="margin:14px 0 4px; color:#ffffff; font-size:25px; line-height:1.2;">Abstract Decision Update</h1>
          <p style="margin:0; color:#fce7f3; font-size:14px;">Global Healthcare Conclave 2026</p>
        </td></tr>
        <tr><td style="padding:30px 30px 10px; text-align:center;">
          <div style="display:inline-block; padding:7px 16px; border-radius:999px; background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:12px; font-weight:800; letter-spacing:.4px; text-transform:uppercase;">Not Accepted</div>
          <h2 style="margin:18px 0 8px; color:#0f172a; font-size:22px; line-height:1.3;">Thank you, {{fullName}}</h2>
          <p style="margin:0; color:#475569; font-size:15px; line-height:1.6;">Thank you for submitting your abstract to the GHC 2026 research program.</p>
        </td></tr>
        <tr><td style="padding:18px 30px;">
          <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:20px;">
            <p style="margin:0 0 6px; color:#64748b; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Abstract Details</p>
            <h3 style="margin:0 0 14px; color:#0f172a; font-size:18px; line-height:1.35;">{{abstractTitle}}</h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px; color:#334155;">
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Abstract Code</td><td style="padding:6px 0; text-align:right; font-weight:800; color:#173B8F;">{{abstractCode}}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Category</td><td style="padding:6px 0; text-align:right; font-weight:700;">{{category}}</td></tr>
            </table>
          </div>
        </td></tr>
        <tr><td style="padding:0 30px 22px;">
          <div style="background:#fff7ed; border-left:4px solid #f97316; border-radius:10px; padding:16px;">
            <p style="margin:0 0 6px; color:#9a3412; font-size:12px; font-weight:800; text-transform:uppercase;">Committee Feedback</p>
            <p style="margin:0; color:#334155; font-size:14px; line-height:1.6; white-space:pre-wrap;">{{reviewComments}}</p>
          </div>
        </td></tr>
        <tr><td style="padding:0 30px 30px;"><p style="margin:0; color:#475569; font-size:14px; line-height:1.7;">After review, the Scientific Committee is unable to accept this abstract for presentation. We appreciate your contribution and encourage you to stay engaged with GHC scientific activities.</p></td></tr>
        <tr><td style="background:#081B33; padding:22px 30px; text-align:center;">
          <p style="margin:0 0 6px; color:#ffffff; font-size:13px; font-weight:800;">Global Healthcare Conclave 2026</p>
          <p style="margin:0; color:#94a3b8; font-size:12px;">For assistance, contact <a href="mailto:{{contactEmail}}" style="color:#38bdf8; text-decoration:none;">{{contactEmail}}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
    
    // Insert abstract revision templates
    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'abstract_revision_required',
        'Revision Requested for {{abstractTitle}}',
        'Hello {{fullName}},\n\nYour abstract:\n"{{abstractTitle}}"\n\nhas been sent back for revision.\n\nReviewer comments / required revisions:\n{{revisionInstructions}}\n\nPlease submit your revised abstract using this secure link:\n{{revisionLink}}\n\nThis link expires on {{expiresAt}}. For assistance, contact {{contactEmail}}.',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);

    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'abstract_revision_submitted',
        'Your Revised Abstract Has Been Submitted',
        'Hello {{fullName}},\n\nYour revised abstract "{{abstractTitle}}" has been received and returned to the Scientific Committee review workflow.\n\nAbstract Code: {{abstractCode}}\nVersion: {{versionNumber}}\n\nThis is a submission confirmation, not an approval notice.',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);

    await pool.query(
      `INSERT INTO email_templates (template_key, subject, body, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body), is_active = 1`,
      [
        'abstract_accepted',
        'Your GHC 2026 Abstract Has Been Accepted',
        abstractAcceptedTemplate,
      ]
    );

    await pool.query(
      `INSERT INTO email_templates (template_key, subject, body, is_active)
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body), is_active = 1`,
      [
        'abstract_rejected',
        'Update on Your GHC 2026 Abstract Submission',
        abstractRejectedTemplate,
      ]
    );

    console.log("Email templates inserted.");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    process.exit(0);
  }
}

updateSchema();
