const dns = require('dns');
const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

// Ensure Node's DNS resolution prefers IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// In environments like Railway where outbound IPv6 is unreachable, nodemailer v8
// resolves both A and AAAA records and randomly selects an address.
// Intercepting resolve6 for SMTP hosts ensures only IPv4 addresses are selected.
const patchDnsResolverForIpv4 = () => {
  const isSmtpHost = (hostname) => {
    const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').toLowerCase();
    const target = (hostname || '').toLowerCase();
    return target === smtpHost || target.endsWith('.gmail.com') || target.endsWith('.google.com');
  };

  if (dns.Resolver && dns.Resolver.prototype && dns.Resolver.prototype.resolve6) {
    const originalResolve6 = dns.Resolver.prototype.resolve6;
    dns.Resolver.prototype.resolve6 = function (hostname, callback) {
      if (isSmtpHost(hostname)) {
        const err = new Error(`IPv6 resolution bypassed for SMTP host: ${hostname}`);
        err.code = dns.NODATA;
        return setImmediate(() => callback(err));
      }
      return originalResolve6.apply(this, arguments);
    };
  }

  if (typeof dns.resolve6 === 'function') {
    const originalDnsResolve6 = dns.resolve6;
    dns.resolve6 = function (hostname, ...args) {
      const callback = args[args.length - 1];
      if (typeof callback === 'function' && isSmtpHost(hostname)) {
        const err = new Error(`IPv6 resolution bypassed for SMTP host: ${hostname}`);
        err.code = dns.NODATA;
        return setImmediate(() => callback(err));
      }
      return originalDnsResolve6.apply(this, args);
    };
  }
};

patchDnsResolverForIpv4();

/**
 * Normalizes and reads SMTP configuration from environment variables.
 * Supports both SMTP_USER / SMTP_PASS and SMTP_USERNAME / SMTP_PASSWORD.
 */
const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  // Port 465 requires secure: true; Port 587 requires secure: false (with STARTTLS)
  const secure = port === 465;
  const user = process.env.SMTP_USER || process.env.SMTP_USERNAME || null;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || null;
  const fromName = process.env.SMTP_FROM_NAME || 'Global Health Conclave';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.MAIL_FROM || user;

  return { host, port, secure, user, pass, fromName, fromEmail };
};

/**
 * Diagnostic logger that prints SMTP connection info without exposing credentials.
 */
const logSmtpDiagnostics = (status = 'Connecting') => {
  const { host, port, secure, user } = getSmtpConfig();
  console.log(`[SMTP] Status: ${status} | Host: ${host} | Port: ${port} | Secure: ${secure} | Family: 4 | Username: ${user || '(none)'}`);
};

/**
 * Diagnostic error logger that formats SMTP error details cleanly.
 * Never logs the SMTP password.
 */
const logSmtpError = (context, error) => {
  const { host, port, user } = getSmtpConfig();
  console.error(`[SMTP Error] ${context}:`, {
    host,
    port,
    user: user || '(none)',
    code: error.code || null,
    command: error.command || null,
    response: error.response || null,
    responseCode: error.responseCode || null,
    message: error.message || String(error),
  });
};

/**
 * Creates a Nodemailer transporter configured strictly for IPv4 and STARTTLS.
 */
const createTransporter = () => {
  const { host, port, secure, user, pass } = getSmtpConfig();

  return nodemailer.createTransport({
    host,
    port,
    secure,
    family: 4,
    auth: user && pass
      ? {
          user,
          pass,
        }
      : undefined,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
  });
};

const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  const { host, port, user, fromName, fromEmail } = getSmtpConfig();
  logSmtpDiagnostics(`Sending email to ${to}`);

  const transporter = createTransporter();
  try {
    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });
    console.log(`[SMTP] Email successfully sent to ${to} | Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    logSmtpError(`Failed to send email to ${to}`, error);
    throw error;
  }
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
  const { host, port, secure, user } = getSmtpConfig();
  logSmtpDiagnostics('Verifying SMTP connection');

  const transporter = createTransporter();
  try {
    await transporter.verify();
    console.log(`[SMTP] Connection verified successfully -> ${host}:${port} (family: 4)`);
    return {
      success: true,
      host,
      port,
      secure,
      family: 4,
      user: user || null,
      status: 'connected',
    };
  } catch (error) {
    logSmtpError('Verification failed', error);
    throw error;
  }
};

module.exports = {
  createTransporter,
  getSmtpConfig,
  sendMail,
  sendTemplateEmail,
  verifyConnection,
};
