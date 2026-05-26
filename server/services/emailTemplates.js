const base = ({ title, children }) => `
  <!doctype html>
  <html>
    <body style="margin:0;background:#f7fbff;font-family:Inter,Arial,sans-serif;color:#081b33;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px;">
        <tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbeafe;">
            <tr><td style="padding:24px;background:#081b33;color:#ffffff;">
              <strong style="font-size:18px;">Global Healthcare Conclave 2026</strong>
            </td></tr>
            <tr><td style="padding:24px;">
              <h1 style="margin:0 0 16px;font-size:26px;line-height:1.1;">${title}</h1>
              ${children}
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
  </html>
`;

const templates = {
  registrationConfirmation: (data) => base({ title: 'Registration received', children: `<p>Dear ${data.name}, your registration ${data.registrationId} has been received.</p>` }),
  paymentConfirmation: (data) => base({ title: 'Payment confirmed', children: `<p>Your payment of ${data.amount} is confirmed.</p>` }),
  workshopRegistrationConfirmation: (data) => base({
    title: 'Workshop Registration Confirmed',
    children: `
      <p>Dear ${data.name || 'delegate'}, your workshop registration is confirmed.</p>
      <p><strong>Workshop:</strong> ${data.workshop}</p>
      <p><strong>Faculty:</strong> ${data.faculty || 'To be announced'}</p>
      <p><strong>Date:</strong> ${data.date || 'Dates will be announced soon'}</p>
      <p><strong>Venue:</strong> ${data.venue || 'Venue will be announced soon'}</p>
      <p><strong>Registration ID:</strong> ${data.registrationId || '-'}</p>
      <p>Your QR code, receipt, calendar invite and invoice will be shared when available.</p>
    `,
  }),
  workshopApproval: (data) => base({ title: 'Workshop approved', children: `<p>You are approved for ${data.workshop}.</p>` }),
  researchAcceptance: (data) => base({ title: 'Research accepted', children: `<p>Your submission ${data.title} has been accepted.</p>` }),
  certificateIssue: (data) => base({ title: 'Certificate issued', children: `<p>Your ${data.type} certificate is ready.</p>` }),
  speakerInvite: (data) => base({ title: 'Speaker invitation', children: `<p>Dear ${data.name}, we invite you to speak at GHC 2026.</p>` }),
  partnerOnboarding: (data) => base({ title: 'Partner onboarding', children: `<p>Welcome ${data.name} to the GHC partner circle.</p>` }),
};

module.exports = templates;
