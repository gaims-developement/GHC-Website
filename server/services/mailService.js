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
  // Default to 465 (SSL) for Gmail if unspecified as it is rarely blocked by cloud providers
  const port = Number(process.env.SMTP_PORT || (host.includes('gmail.com') ? 465 : 587));
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
const logSmtpDiagnostics = (status = 'Connecting', customPort = null, customSecure = null) => {
  const { host, port, secure, user } = getSmtpConfig();
  const activePort = customPort || port;
  const activeSecure = customSecure !== null ? customSecure : (activePort === 465);
  console.log(`[SMTP] Status: ${status} | Host: ${host} | Port: ${activePort} | Secure: ${activeSecure} | Family: 4 | Username: ${user || '(none)'}`);
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
 * Creates a Nodemailer transporter configured strictly for IPv4 and resilient timeouts.
 */
const createTransporter = (overridePort = null, overrideSecure = null) => {
  const { host, port, secure, user, pass } = getSmtpConfig();
  const targetPort = overridePort || port;
  const targetSecure = overrideSecure !== null ? overrideSecure : (targetPort === 465);

  return nodemailer.createTransport({
    host,
    port: targetPort,
    secure: targetSecure,
    family: 4,
    auth: user && pass
      ? {
          user,
          pass,
        }
      : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    },
  });
};

const sendViaResend = async ({ to, subject, html, text }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Global Health Conclave';
  const fromEmail = process.env.RESEND_FROM || 'onboarding@resend.dev';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }
  console.log(`[Resend] Email successfully sent to ${to} | ID: ${data.id}`);
  return { messageId: data.id };
};

const sendViaBrevo = async ({ to, subject, html, text }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'Global Health Conclave';
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'itcellgaims@gmail.com';
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: fromName, email: fromEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || JSON.stringify(data));
  }
  console.log(`[Brevo] Email successfully sent to ${to} | Message ID: ${data.messageId}`);
  return { messageId: data.messageId };
};

const sendMail = async ({ to, subject, html, text, attachments = [] }) => {
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResend({ to, subject, html, text });
    } catch (apiErr) {
      console.warn('[Resend Warning] HTTP send failed, falling back to SMTP:', apiErr.message);
    }
  }

  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevo({ to, subject, html, text });
    } catch (apiErr) {
      console.warn('[Brevo Warning] HTTP send failed, falling back to SMTP:', apiErr.message);
    }
  }

  const { host, port, secure, fromName, fromEmail } = getSmtpConfig();
  logSmtpDiagnostics(`Sending email to ${to}`, port, secure);

  try {
    const transporter = createTransporter(port, secure);
    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });
    console.log(`[SMTP] Email successfully sent to ${to} on port ${port} | Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    const isConnectionIssue = error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ESOCKETTIMEDOUT' ||
      error.command === 'CONN' ||
      String(error.message).toLowerCase().includes('timeout');

    // Automatic fallback between 465 (SSL) and 587 (STARTTLS)
    const fallbackPort = port === 465 ? 587 : 465;
    const fallbackSecure = fallbackPort === 465;

    if (isConnectionIssue) {
      console.warn(`[SMTP Warning] Port ${port} failed (${error.message}). Attempting automatic fallback to port ${fallbackPort} (secure: ${fallbackSecure})...`);
      try {
        const fallbackTransporter = createTransporter(fallbackPort, fallbackSecure);
        const result = await fallbackTransporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to,
          subject,
          html,
          text,
          attachments,
        });
        console.log(`[SMTP Fallback] Email successfully sent to ${to} on fallback port ${fallbackPort} | Message ID: ${result.messageId}`);
        return result;
      } catch (fallbackErr) {
        logSmtpError(`Fallback to port ${fallbackPort} also failed for ${to}`, fallbackErr);
        throw fallbackErr;
      }
    }

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
