const { Resend } = require('resend');
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

// Single Resend client instance
let resend = null;
let smtpTransporter = null;
let smtpSignature = null;
const getResendClient = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend || resend.key !== key) {
    resend = new Resend(key);
  }
  return resend;
};

// Initial attempt to instantiate if key is present at require time
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USERNAME || process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass) return null;
  return {
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: { user, pass },
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
  };
};

const getSmtpTransporter = () => {
  const config = getSmtpConfig();
  if (!config) return null;
  const signature = JSON.stringify({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
  });
  if (!smtpTransporter || smtpSignature !== signature) {
    smtpTransporter = nodemailer.createTransport(config);
    smtpSignature = signature;
  }
  return smtpTransporter;
};

const formatAddress = (name, emailOrAddress) => {
  const value = String(emailOrAddress || '').trim();
  if (!value) return '';
  if (value.includes('<') && value.includes('>')) return value;
  return `"${String(name || 'Global Healthcare Conclave').replace(/"/g, '')}" <${value}>`;
};

/**
 * Normalizes sender address from environment variables.
 * Priority:
 * 1. EMAIL_FROM (e.g. "GHC <notifications@ghc.gaims.org>")
 * 2. RESEND_FROM
 * 3. Safe fallback for unverified domains / initial testing: "Global Healthcare Conclave <onboarding@resend.dev>"
 */
const getSenderConfig = () => {
  const fromName = process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Global Healthcare Conclave';
  let fromAddress = process.env.EMAIL_FROM || process.env.RESEND_FROM;

  if (!fromAddress) {
    const legacyFromEmail = process.env.SMTP_FROM_EMAIL;
    if (legacyFromEmail && !legacyFromEmail.endsWith('@gmail.com')) {
      fromAddress = `"${fromName}" <${legacyFromEmail}>`;
    } else {
      // Resend requires a verified domain or onboarding@resend.dev for test sending
      fromAddress = `"${fromName}" <onboarding@resend.dev>`;
    }
  }

  return {
    from: fromAddress,
    hasApiKey: Boolean(process.env.RESEND_API_KEY),
  };
};

const getSmtpSenderConfig = () => {
  const fromName = process.env.EMAIL_FROM_NAME || process.env.SMTP_FROM_NAME || 'Global Healthcare Conclave';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USERNAME || process.env.SMTP_USER;
  return {
    from: formatAddress(fromName, fromEmail),
    hasSmtp: Boolean(getSmtpConfig()),
  };
};

/**
 * Format attachments for Resend Node SDK.
 * Supports: { filename, content: Buffer | string, path }
 */
const formatAttachments = (attachments = []) => {
  if (!Array.isArray(attachments)) return [];
  return attachments.map((att) => {
    const formatted = {
      filename: att.filename || att.name || 'attachment',
    };
    if (att.content !== undefined) {
      formatted.content = att.content;
    } else if (att.path) {
      formatted.path = att.path;
    }
    if (att.contentType || att.content_type) {
      formatted.content_type = att.contentType || att.content_type;
    }
    if (att.cid || att.content_id) {
      formatted.content_id = att.cid || att.content_id;
    }
    return formatted;
  });
};

/**
 * Main email sending method. Prefer configured SMTP; fall back to Resend.
 */
const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  const provider = String(process.env.EMAIL_PROVIDER || '').trim().toLowerCase();
  const useSmtp = provider === 'smtp' || (!provider && getSmtpConfig());

  if (useSmtp) {
    const transporter = getSmtpTransporter();
    if (!transporter) {
      throw new Error('SMTP is not configured in environment variables.');
    }

    const { from } = getSmtpSenderConfig();
    const recipients = Array.isArray(to) ? to : [to];
    const payload = {
      from,
      to: recipients,
      subject,
      html: html || (text ? `<p style="white-space: pre-wrap;">${text}</p>` : ''),
      text: text || undefined,
      attachments: formatAttachments(attachments),
    };

    try {
      const info = await transporter.sendMail(payload);
      console.log('[EMAIL] Provider: SMTP');
      console.log('[EMAIL] Sent successfully');
      console.log(`[EMAIL] ID: ${info.messageId || 'unknown'}`);
      return {
        messageId: info.messageId || 'unknown',
        id: info.messageId || 'unknown',
        provider: 'smtp',
        data: info,
      };
    } catch (error) {
      const sanitizedError = error.message || String(error);
      console.error('[EMAIL] Provider: SMTP');
      console.error('[EMAIL] Send failed');
      console.error(`[EMAIL] Error: ${sanitizedError}`);
      throw new Error(sanitizedError);
    }
  }

  const client = getResendClient();
  if (!client) {
    const err = new Error('RESEND_API_KEY is not configured in environment variables.');
    console.error('[EMAIL] Provider: Resend');
    console.error('[EMAIL] Send failed');
    console.error(`[EMAIL] Error: ${err.message}`);
    throw err;
  }

  const { from } = getSenderConfig();
  const recipients = Array.isArray(to) ? to : [to];

  const payload = {
    from,
    to: recipients,
    subject,
    html: html || (text ? `<p style="white-space: pre-wrap;">${text}</p>` : ''),
    text: text || undefined,
  };

  const formattedAttachments = formatAttachments(attachments);
  if (formattedAttachments.length > 0) {
    payload.attachments = formattedAttachments;
  }

  try {
    const { data, error } = await client.emails.send(payload);

    if (error) {
      throw new Error(error.message || 'Failed to send email via Resend');
    }

    const emailId = data?.id || 'unknown';
    console.log('[EMAIL] Provider: Resend');
    console.log('[EMAIL] Sent successfully');
    console.log(`[EMAIL] ID: ${emailId}`);

    return {
      messageId: emailId,
      id: emailId,
      provider: 'resend',
      data,
    };
  } catch (error) {
    const sanitizedError = (error.message || String(error)).replace(/re_[a-zA-Z0-9_\-]+/g, '[REDACTED]');
    console.error('[EMAIL] Provider: Resend');
    console.error('[EMAIL] Send failed');
    console.error(`[EMAIL] Error: ${sanitizedError}`);
    throw new Error(sanitizedError);
  }
};

const htmlToText = (html = '') =>
  String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<\/(p|div|h1|h2|h3|tr|table|li)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/**
 * Template email rendering, variable interpolation, and persistent logging
 */
const sendTemplateEmail = async (templateKey, to, variables = {}) => {
  let logId = null;
  let subject = 'No Subject';
  const recipient = Array.isArray(to) ? to.join(', ') : to;

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
      subject = subject.replace(regex, value !== undefined && value !== null ? value : '');
      body = body.replace(regex, value !== undefined && value !== null ? value : '');
    }

    const isHtml = body.includes('<');
    const htmlBody = isHtml ? body : `<div style="font-family: sans-serif; line-height: 1.6; white-space: pre-wrap;">${body}</div>`;
    const textBody = isHtml ? htmlToText(body) : body;

    const [logResult] = await pool.query(
      "INSERT INTO email_logs (recipient, subject, status) VALUES (?, ?, 'queued')",
      [recipient, subject]
    );
    logId = logResult.insertId;

    const result = await sendMail({
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });

    await pool.query(
      "UPDATE email_logs SET status = 'sent', sent_at = NOW(), error_message = NULL WHERE id = ?",
      [logId]
    );

    return result;
  } catch (error) {
    if (logId) {
      await pool.query(
        "UPDATE email_logs SET status = 'failed', error_message = ? WHERE id = ?",
        [error.message || String(error), logId]
      ).catch(() => {});
    } else {
      await pool.query(
        "INSERT INTO email_logs (recipient, subject, status, error_message) VALUES (?, ?, 'failed', ?)",
        [recipient, subject, error.message || String(error)]
      ).catch(() => {});
    }

    throw error;
  }
};

/**
 * Safe Resend configuration and API diagnostic verification.
 * Does not send any email.
 */
const verifyConnection = async () => {
  const smtp = getSmtpTransporter();
  if (smtp) {
    await smtp.verify();
    return {
      success: true,
      provider: 'smtp',
      message: 'SMTP authenticated successfully',
      from: getSmtpSenderConfig().from,
    };
  }

  const client = getResendClient();
  if (!client) {
    throw new Error('RESEND_API_KEY environment variable is missing.');
  }

  // Check authentication by calling domains.list() or apiKeys.list()
  // Note: Sending-only keys might return 403 on domain/api-key listing, which still verifies authentication
  try {
    const { data, error } = await client.apiKeys.list();
    if (error) {
      if (error.statusCode === 401 || error.statusCode === 400) {
        throw new Error(`Resend authentication failed: ${error.message || 'Invalid API key'}`);
      }
      // If 403, key is authentic but has restricted permissions (e.g. sending-only)
      if (error.statusCode === 403) {
        return {
          success: true,
          provider: 'resend',
          message: 'Resend API authenticated successfully (Sending-restricted access)',
          from: getSenderConfig().from,
        };
      }
    }
  } catch (err) {
    if (err.message && err.message.includes('Resend authentication failed')) {
      throw err;
    }
    // If apiKeys failed with another reason, attempt domains.list as fallback check
    try {
      const { error: domainError } = await client.domains.list();
      if (domainError && (domainError.statusCode === 401 || domainError.statusCode === 400)) {
        throw new Error(`Resend authentication failed: ${domainError.message || 'Invalid API key'}`);
      }
    } catch (domainErr) {
      if (domainErr.message && domainErr.message.includes('Resend authentication failed')) {
        throw domainErr;
      }
    }
  }

  return {
    success: true,
    provider: 'resend',
    message: 'Resend API authenticated successfully',
    from: getSenderConfig().from,
  };
};

module.exports = {
  sendMail,
  sendEmail: sendMail,
  sendTemplateEmail,
  verifyConnection,
  getSenderConfig,
  getSmtpSenderConfig,
};
