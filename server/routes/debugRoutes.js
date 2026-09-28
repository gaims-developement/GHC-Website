const express = require('express');
const { verifyConnection, getSenderConfig } = require('../services/mailService');

const router = express.Router();

// TODO: Remove temporary email diagnostic endpoint after Resend migration is verified.
router.get('/email', async (_req, res) => {
  console.log('--- RESEND EMAIL DEBUG START ---');
  const senderConfig = getSenderConfig();
  console.log(`PROVIDER: Resend`);
  console.log(`SENDER_FROM: ${senderConfig.from}`);
  console.log(`RESEND_API_KEY_PRESENT: ${senderConfig.hasApiKey}`);

  try {
    const result = await verifyConnection();
    console.log('RESEND EMAIL DEBUG SUCCESS: Authenticated successfully with Resend');
    console.log('--- RESEND EMAIL DEBUG END ---');

    return res.json({
      success: true,
      provider: 'resend',
      message: result.message,
      from: senderConfig.from,
    });
  } catch (error) {
    console.error('RESEND EMAIL DEBUG ERROR:');
    console.error(`message: ${error.message || String(error)}`);
    console.error('--- RESEND EMAIL DEBUG END ---');

    return res.status(500).json({
      success: false,
      provider: 'resend',
      message: error.message || 'Resend verification failed',
    });
  }
});

// Backward-compatible redirect for any existing callers of /smtp
router.get('/smtp', (_req, res) => {
  res.redirect('/api/debug/email');
});

module.exports = router;
