const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USERNAME
      ? {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        }
      : undefined,
  });

const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Global Health Conclave';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME;

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    text,
    attachments,
  });
};

const sendTemplateEmail = async (templateKey, to, variables = {}) => {
  let logId = null;
  let subject = 'No Subject';
  try {
    const [templates] = await pool.query('SELECT * FROM email_templates WHERE template_key = ? LIMIT 1', [templateKey]);
    const template = templates[0];
    
    if (!template) {
      throw new Error(`Email template '${templateKey}' not found.`);
    }

    subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    const [logResult] = await pool.query(
      "INSERT INTO email_logs (recipient, subject, status) VALUES (?, ?, 'queued')",
      [to, subject]
    );
    logId = logResult.insertId;

    const result = await sendMail({
      to,
      subject,
      text: body,
      html: body,
    });

    await pool.query(
      "UPDATE email_logs SET status = 'sent', sent_at = NOW() WHERE id = ?",
      [logId]
    );

    return result;
  } catch (error) {
    console.error('Error sending template email:', error);
    
    if (logId) {
      await pool.query(
        "UPDATE email_logs SET status = 'failed', error_message = ? WHERE id = ?",
        [error.message || String(error), logId]
      );
    } else {
      await pool.query(
        "INSERT INTO email_logs (recipient, subject, status, error_message) VALUES (?, ?, 'failed', ?)",
        [to, subject, error.message || String(error)]
      );
    }
    
    throw error;
  }
};

const verifyConnection = async () => {
  const transporter = createTransporter();
  await transporter.verify();
};

module.exports = { sendMail, sendTemplateEmail, verifyConnection };
