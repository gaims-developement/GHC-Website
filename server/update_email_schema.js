require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { pool } = require('./config/db');

const shellStart = `<!doctype html>
<html>
<body style="margin:0; padding:0; background:#eef4fb; font-family: Arial, Helvetica, sans-serif; color:#10233f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef4fb; padding:34px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px; background:#ffffff; border:1px solid #dbe6f3; border-radius:18px; overflow:hidden; box-shadow:0 18px 40px rgba(8,27,51,0.12);">`;

const shellEnd = `
        <tr><td style="background:#081B33; padding:24px 30px; text-align:center;">
          <p style="margin:0 0 5px; color:#ffffff; font-size:13px; font-weight:800;">Scientific Committee</p>
          <p style="margin:0; color:#a9b8cf; font-size:12px;">Global Healthcare Conclave 2026</p>
          <p style="margin:10px 0 0; color:#a9b8cf; font-size:12px;">For assistance, contact <a href="mailto:{{contactEmail}}" style="color:#67e8f9; text-decoration:none;">{{contactEmail}}</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const header = (label, title, accent = '#00A6A6') => `
        <tr>
          <td style="background:linear-gradient(135deg,#081B33 0%,#173B8F 58%,${accent} 100%); padding:32px 30px; text-align:center;">
            <div style="display:inline-block; padding:6px 14px; border-radius:999px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.24); color:#ffffff; font-size:11px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase;">${label}</div>
            <h1 style="margin:15px 0 5px; color:#ffffff; font-size:26px; line-height:1.2;">${title}</h1>
            <p style="margin:0; color:#d9f7ff; font-size:14px;">Global Healthcare Conclave 2026</p>
          </td>
        </tr>`;

const abstractCard = `
        <tr><td style="padding:18px 30px 22px;">
          <div style="background:#f8fbff; border:1px solid #dbe6f3; border-radius:14px; padding:19px 20px;">
            <p style="margin:0 0 7px; color:#64748b; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase;">Abstract Details</p>
            <h3 style="margin:0 0 14px; color:#081B33; font-size:18px; line-height:1.35;">{{abstractTitle}}</h3>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:13px; color:#334155;">
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Abstract Code</td><td style="padding:6px 0; text-align:right; font-weight:800; color:#173B8F;">{{abstractCode}}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b; font-weight:700;">Category</td><td style="padding:6px 0; text-align:right; font-weight:700;">{{category}}</td></tr>
            </table>
          </div>
        </td></tr>`;

const abstractAcceptedTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>GHC Abstract Selected</title>
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    body { margin: 0; padding: 0; background-color: #f4f7fb; }
    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px !important; }
      .header { padding: 28px 22px !important; }
      .header-title { font-size: 23px !important; }
      .content { padding: 28px 22px !important; }
      .footer { padding: 22px !important; }
      .button { display: block !important; width: auto !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f7fb" style="background-color:#f4f7fb;">
    <tr>
      <td class="wrapper" align="center" bgcolor="#f4f7fb" style="background-color:#f4f7fb; padding:40px 15px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="width:100%; max-width:680px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.06);">
          <tr>
            <td class="header" align="center" bgcolor="#1e3a8a" style="background-color:#1e3a8a; background-image:linear-gradient(135deg,#0f172a,#1e3a8a); padding:35px 40px; text-align:center;">
              <div style="color:#ffffff !important; -webkit-text-fill-color:#ffffff; font-size:14px; font-weight:700; letter-spacing:2px; margin-bottom:14px;">GLOBAL HEALTH CONCLAVE</div>
              <h1 class="header-title" style="color:#ffffff !important; -webkit-text-fill-color:#ffffff; font-size:28px; font-weight:700; margin:0; line-height:1.3;">Congratulations!</h1>
              <p style="color:#dbeafe !important; -webkit-text-fill-color:#dbeafe; font-size:14px; margin:8px 0 0;">Your abstract has been selected for presentation</p>
            </td>
          </tr>
          <tr>
            <td class="content" bgcolor="#ffffff" style="background-color:#ffffff; padding:40px; font-family:Arial, Helvetica, sans-serif;">
              <p style="font-size:16px; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">Dear <strong>{{name}}</strong>,</p>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">Thank you for your interest in presenting at the <strong>Global Health Conclave (GHC)</strong>. We received an excellent and highly competitive set of submissions, and each abstract was carefully evaluated based on innovation, relevance, and academic merit.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ecfdf5" style="background-color:#ecfdf5; border:1px solid #a7f3d0; border-radius:12px; margin:25px 0;">
                <tr><td align="center" style="padding:22px;">
                  <div style="color:#047857 !important; -webkit-text-fill-color:#047857; font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; margin-bottom:10px;">Abstract Selected</div>
                  <p style="color:#064e3b !important; -webkit-text-fill-color:#064e3b; font-size:18px; font-weight:700; line-height:1.5; margin:0;">&ldquo;{{title}}&rdquo;</p>
                </td></tr>
              </table>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">We are pleased to inform you that your poster has been <strong>SELECTED for presentation</strong> at the Global Health Conclave.</p>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">We appreciate the quality of your work and look forward to seeing your poster and welcoming your active participation at GHC.</p>
              <h2 style="font-size:20px; color:#111827 !important; -webkit-text-fill-color:#111827; margin:30px 0 18px;">Next Steps</h2>
              <h3 style="font-size:16px; font-weight:700; color:#111827 !important; -webkit-text-fill-color:#111827; margin:25px 0 12px;">1. Confirm Participation for Selected Abstracts</h3>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">To confirm your participation, please complete the required confirmation process using the secure link below:</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px;">
                <a href="{{participationLink}}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff !important; -webkit-text-fill-color:#ffffff; padding:14px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:700;">Confirm Your Participation</a>
              </td></tr></table>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">This confirmation helps the Scientific Committee coordinate:</p>
              <ul style="padding-left:22px; margin:10px 0 20px;">
                <li style="font-size:15px; line-height:1.8; color:#4b5563 !important; -webkit-text-fill-color:#4b5563;">Conference participation</li>
                <li style="font-size:15px; line-height:1.8; color:#4b5563 !important; -webkit-text-fill-color:#4b5563;">Scientific poster presentation planning</li>
                <li style="font-size:15px; line-height:1.8; color:#4b5563 !important; -webkit-text-fill-color:#4b5563;">Presenter communication and schedule updates</li>
                <li style="font-size:15px; line-height:1.8; color:#4b5563 !important; -webkit-text-fill-color:#4b5563;">Food and accommodation coordination, where applicable</li>
              </ul>
              <div style="background-color:#f9fafb; border-left:4px solid #2563eb; padding:16px 18px; margin:20px 0; border-radius:6px; font-size:14px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563;">
                <strong>Important:</strong> The Medical Student Hands-On Workshop is not included in the abstract presentation registration.
                <br><br>
                Workshop access is free for eligible GAIMS Elite Members. If you are not an Elite Member, you may need to purchase a GAIMS Elite Membership to access the workshop.
              </div>
              <h3 style="font-size:16px; font-weight:700; color:#111827 !important; -webkit-text-fill-color:#111827; margin:25px 0 12px;">2. Join the GHC Abstract WhatsApp Group</h3>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">Please join the official GHC Abstract WhatsApp Group to receive important updates regarding abstract presentations, poster presentation instructions, scientific committee announcements, schedules, deadlines, and other abstract-related updates.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 20px;">
                <a href="{{whatsappGroupLink}}" target="_blank" style="display:inline-block; background-color:#16a34a; color:#ffffff !important; -webkit-text-fill-color:#ffffff; padding:14px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:700;">Join GHC Abstract WhatsApp Group</a>
              </td></tr></table>
              <div style="border-top:1px solid #e5e7eb; margin:30px 0;"></div>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">If the confirmation button does not open, use this link:<br><a href="{{participationLink}}" style="color:#2563eb !important; -webkit-text-fill-color:#2563eb;">{{participationLink}}</a></p>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">If you have any questions or require further assistance, please feel free to reach out to the GHC Scientific Committee.</p>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:0 0 18px;">We look forward to your participation at the <strong>Global Health Conclave</strong>.</p>
              <p style="font-size:15px; line-height:1.7; color:#4b5563 !important; -webkit-text-fill-color:#4b5563; margin:28px 0 0;">Warm regards,<br><strong>GHC Scientific Committee</strong></p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" style="background-color:#f8fafc; padding:25px 40px; text-align:center; font-family:Arial, Helvetica, sans-serif;">
              <p style="font-size:14px; font-weight:700; color:#374151 !important; -webkit-text-fill-color:#374151; margin:0 0 6px;">Global Health Conclave</p>
              <p style="font-size:13px; line-height:1.6; color:#6b7280 !important; -webkit-text-fill-color:#6b7280; margin:0;">Scientific Research Committee</p>
              <p style="font-size:13px; line-height:1.6; color:#6b7280 !important; -webkit-text-fill-color:#6b7280; margin:10px 0 0;">This is an automated email. Please do not reply directly unless instructed by the GHC team.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const abstractRejectedTemplate = `${shellStart}
${header('GHC 2026 Scientific Committee', 'Abstract Decision Update', '#e244b7')}
        <tr><td style="padding:31px 30px 8px;">
          <div style="text-align:center;">
            <div style="display:inline-block; padding:7px 16px; border-radius:999px; background:#fff1f2; border:1px solid #fecdd3; color:#be123c; font-size:12px; font-weight:800; letter-spacing:.4px; text-transform:uppercase;">Not Selected</div>
            <h2 style="margin:18px 0 10px; color:#081B33; font-size:23px; line-height:1.3;">Dear {{fullName}}</h2>
          </div>
          <p style="margin:0; color:#334155; font-size:15px; line-height:1.7;">Thank you for submitting your abstract titled <strong>&ldquo;{{title}}&rdquo;</strong> to the Global Health Conclave 2026.</p>
        </td></tr>
${abstractCard}
        <tr><td style="padding:0 30px 22px;">
          <div style="background:#fff7ed; border-left:4px solid #f97316; border-radius:10px; padding:16px;">
            <p style="margin:0 0 7px; color:#9a3412; font-size:12px; font-weight:800; text-transform:uppercase;">Final Decision</p>
            <p style="margin:0; color:#334155; font-size:14px; line-height:1.7;"><strong>Not Selected</strong></p>
          </div>
        </td></tr>
        <tr><td style="padding:0 30px 16px;">
          <p style="margin:0; color:#334155; font-size:14px; line-height:1.7;">After a thorough and careful evaluation, we regret to inform you that your abstract was not selected for presentation this year. We sincerely appreciate the effort and thought you invested in your submission, and we encourage you to apply again for future conferences.</p>
        </td></tr>
        <tr><td style="padding:0 30px 30px;">
          <p style="margin:0 0 18px; color:#334155; font-size:14px; line-height:1.7;">We wish you the very best in your academic journey.</p>
          <p style="margin:0; color:#334155; font-size:14px; line-height:1.7;">Warm regards,<br><strong>GHC Scientific Research Committee</strong></p>
        </td></tr>
${shellEnd}`;

const abstractRevisionRequiredTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light only">
  <title>Abstract Revision Required - Global Health Conclave</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f7fb" style="background-color:#f4f7fb; padding:30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:650px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 18px rgba(0,0,0,0.08);">
          <tr>
            <td bgcolor="#123d6b" style="background-color:#123d6b; background-image:linear-gradient(135deg,#0b1f3a,#123d6b); padding:35px 30px; text-align:center;">
              <div style="font-size:14px; letter-spacing:2px; color:#cbd5e1 !important; -webkit-text-fill-color:#cbd5e1; font-weight:bold; margin-bottom:10px;">GLOBAL HEALTH CONCLAVE</div>
              <div style="font-size:28px; font-weight:bold; color:#ffffff !important; -webkit-text-fill-color:#ffffff;">Revision Required</div>
              <div style="font-size:14px; color:#dbeafe !important; -webkit-text-fill-color:#dbeafe; margin-top:8px;">Scientific Committee Review</div>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding:35px 30px; font-family:Arial, Helvetica, sans-serif;">
              <p style="font-size:16px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">Dear <strong>{{name}}</strong>,</p>
              <p style="font-size:15px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">Thank you for submitting your abstract titled <strong>&ldquo;{{abstract_title}}&rdquo;</strong> to the <strong>Global Health Conclave</strong>.</p>
              <p style="font-size:15px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">After an initial evaluation, we would like to request a <strong>revised version</strong> of your abstract. While your submission demonstrates strong potential, certain sections require clarification or improvement before it can be reconsidered.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fff7ed" style="background-color:#fff7ed; border-left:4px solid #f59e0b; border-radius:8px; margin:25px 0;">
                <tr><td style="padding:18px 20px;">
                  <div style="font-size:15px; font-weight:bold; color:#92400e !important; -webkit-text-fill-color:#92400e; margin-bottom:8px;">Revision Required</div>
                  <div style="font-size:14px; line-height:1.6; color:#78350f !important; -webkit-text-fill-color:#78350f;">Please revise your abstract by addressing the points highlighted by the Scientific Committee.</div>
                </td></tr>
              </table>
              <p style="font-size:15px; line-height:1.7; margin:0 0 15px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">We kindly request you to revise and resubmit your abstract by addressing the following points:</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:15px 0 25px;">
                <tr><td bgcolor="#f8fafc" style="padding:10px 15px; background-color:#f8fafc; border-radius:6px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;"><strong>1.</strong>&nbsp;&nbsp;{{revision_point_1}}</td></tr>
                <tr><td style="height:8px;"></td></tr>
                <tr><td bgcolor="#f8fafc" style="padding:10px 15px; background-color:#f8fafc; border-radius:6px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;"><strong>2.</strong>&nbsp;&nbsp;{{revision_point_2}}</td></tr>
                <tr><td style="height:8px;"></td></tr>
                <tr><td bgcolor="#f8fafc" style="padding:10px 15px; background-color:#f8fafc; border-radius:6px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;"><strong>3.</strong>&nbsp;&nbsp;{{revision_point_3}}</td></tr>
              </table>
              <p style="font-size:15px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">Please submit the updated abstract through the link provided below. You are also requested to kindly reply to this email after completing the revision.</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:30px 0;">
                <tr><td align="center">
                  <a href="{{revision_link}}" target="_blank" style="display:inline-block; background-color:#123d6b; color:#ffffff !important; -webkit-text-fill-color:#ffffff; text-decoration:none; font-size:15px; font-weight:bold; padding:14px 30px; border-radius:7px;">Revise &amp; Resubmit Abstract</a>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eff6ff" style="background-color:#eff6ff; border-radius:8px; margin:20px 0 25px;">
                <tr><td style="padding:18px 20px; text-align:center;">
                  <div style="font-size:13px; color:#475569 !important; -webkit-text-fill-color:#475569; margin-bottom:5px;">Revision Submission Deadline</div>
                  <div style="font-size:18px; font-weight:bold; color:#123d6b !important; -webkit-text-fill-color:#123d6b;">{{expiresAt}}</div>
                </td></tr>
              </table>
              <p style="font-size:15px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">The revised version must be submitted by <strong>{{expiresAt}}</strong> to allow the committee adequate time for review.</p>
              <p style="font-size:15px; line-height:1.7; margin:0 0 20px; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">If the button does not open, use this secure revision link:<br><a href="{{revision_link}}" style="color:#123d6b !important; -webkit-text-fill-color:#123d6b;">{{revision_link}}</a></p>
              <p style="font-size:15px; line-height:1.7; margin:0; color:#1f2937 !important; -webkit-text-fill-color:#1f2937;">We appreciate your effort and interest in participating in the Global Health Conclave and look forward to receiving your revised submission.</p>
            </td>
          </tr>
          <tr>
            <td bgcolor="#f8fafc" style="background-color:#f8fafc; padding:25px 30px; text-align:center; border-top:1px solid #e5e7eb; font-family:Arial, Helvetica, sans-serif;">
              <div style="font-size:14px; font-weight:bold; color:#123d6b !important; -webkit-text-fill-color:#123d6b; margin-bottom:6px;">Warm regards,</div>
              <div style="font-size:14px; color:#475569 !important; -webkit-text-fill-color:#475569;">GHC Scientific Committee</div>
              <div style="font-size:12px; color:#94a3b8 !important; -webkit-text-fill-color:#94a3b8; margin-top:12px;">Global Health Conclave</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

async function updateSchema() {
  console.log('Updating email schema...');
  try {
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'email_logs' AND COLUMN_NAME = 'error_message'
    `);

    if (columns.length === 0) {
      await pool.query('ALTER TABLE email_logs ADD COLUMN error_message TEXT NULL');
      console.log('Added error_message column to email_logs.');
    } else {
      console.log('error_message column already exists in email_logs.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS abstract_participation_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        abstract_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        applicant_email VARCHAR(255) NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT NULL,
        confirmed_at DATETIME NULL,
        status ENUM('active','confirmed','expired','revoked') DEFAULT 'active',
        KEY idx_participation_tokens_abstract (abstract_id),
        KEY idx_participation_tokens_lookup (token_hash, status, expires_at),
        CONSTRAINT fk_participation_tokens_abstract FOREIGN KEY (abstract_id) REFERENCES abstracts(id) ON DELETE CASCADE
      )
    `);
    console.log('abstract_participation_tokens table is ready.');

    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'test_email',
        'GHC SMTP Test Email',
        'This is a test email from the Global Health Conclave email system. If you received this email, SMTP delivery is working correctly.',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);

    const templates = [
      ['abstract_accepted', 'Your GHC 2026 Abstract Has Been Accepted', abstractAcceptedTemplate],
      ['abstract_rejected', 'Update on Your GHC 2026 Abstract Submission', abstractRejectedTemplate],
      ['abstract_revision_required', 'Revision Requested for {{abstractTitle}}', abstractRevisionRequiredTemplate],
    ];

    for (const template of templates) {
      await pool.query(
        `INSERT INTO email_templates (template_key, subject, body, is_active)
         VALUES (?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body), is_active = 1`,
        template
      );
    }

    await pool.query(`
      INSERT INTO email_templates (template_key, subject, body, is_active)
      VALUES (
        'abstract_revision_submitted',
        'Your Revised Abstract Has Been Submitted',
        'Hello {{fullName}},\n\nYour revised abstract "{{abstractTitle}}" has been received and returned to the Scientific Committee review workflow.\n\nAbstract Code: {{abstractCode}}\nVersion: {{versionNumber}}\n\nThis is a submission confirmation, not an approval notice.',
        1
      ) ON DUPLICATE KEY UPDATE subject = VALUES(subject), body = VALUES(body)
    `);

    console.log('Abstract email templates inserted.');
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    process.exit(0);
  }
}

updateSchema();
