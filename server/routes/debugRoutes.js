const express = require('express');
const dns = require('dns').promises;
const { createTransporter, getSmtpConfig } = require('../services/mailService');

const router = express.Router();

// TODO: Remove temporary SMTP diagnostic endpoint after Railway SMTP connectivity debugging is complete.
router.get('/smtp', async (req, res) => {
  const { host, port, secure } = getSmtpConfig();

  console.log('--- SMTP DEBUG START ---');
  console.log(`SMTP_HOST: ${host}`);
  console.log(`SMTP_PORT: ${port}`);
  console.log(`SMTP_SECURE: ${secure}`);

  // Detailed DNS resolution check for Railway / container diagnostics
  try {
    const addresses = await dns.lookup(host, { all: true });
    console.log('SMTP DNS RESOLUTION:', JSON.stringify(addresses));
  } catch (dnsErr) {
    console.error('SMTP DNS RESOLUTION FAILED:', dnsErr.message);
  }

  // Reuse the existing application Nodemailer transporter
  const transporter = createTransporter();

  try {
    console.log('Initiating transporter.verify()...');
    await transporter.verify();
    console.log('SMTP DEBUG SUCCESS: Connection and authentication verified successfully');
    console.log('--- SMTP DEBUG END ---');

    return res.json({
      success: true,
      message: 'SMTP connection successful',
    });
  } catch (error) {
    console.error('SMTP DEBUG ERROR:');
    console.error(`code: ${error.code || '(none)'}`);
    console.error(`command: ${error.command || '(none)'}`);
    console.error(`message: ${error.message || String(error)}`);
    console.error(`response: ${error.response || '(none)'}`);
    console.error(`responseCode: ${error.responseCode || '(none)'}`);
    console.error('--- SMTP DEBUG END ---');

    return res.status(500).json({
      success: false,
      code: error.code || null,
      command: error.command || null,
      message: error.message || null,
      response: error.response || null,
    });
  }
});

module.exports = router;
