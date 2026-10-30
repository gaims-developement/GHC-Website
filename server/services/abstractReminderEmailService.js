const { createCanvas } = require('@napi-rs/canvas');
const { BANDS, EVENT, SCALE, erase, fitText, getStaticBands, getTopCanvas, toJpeg } = require('./delegateEmailService');

// Reminder for accepted-abstract authors who have not registered. It reuses the registration confirmation artwork:
// the same hero with the headline reworded (on a copy, so the confirmation email is unaffected) and the same footer.
const px = (n) => Math.round(n * SCALE);

let heroPromise = null;
const getHero = () => {
  if (!heroPromise) {
    heroPromise = (async () => {
      const top = await getTopCanvas();
      const canvas = createCanvas(top.width, top.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(top, 0, 0);

      erase(ctx, 80, 222, 490, 240);
      fitText(ctx, 'Abstract Selected', { x: 86, y: 288, maxWidth: 480, size: 62, color: '#ffffff' });
      const blue = ctx.createLinearGradient(86, 0, 520, 0);
      blue.addColorStop(0, '#9fe3f7');
      blue.addColorStop(1, '#5b8fe0');
      fitText(ctx, 'Registration Pending', { x: 86, y: 360, maxWidth: 480, size: 62, color: blue });
      ['Delegate registration is mandatory for all', 'selected presenters at GHC 2026.'].forEach((line, i) => {
        fitText(ctx, line, { x: 87, y: 408 + i * 24, maxWidth: 480, size: 17, weight: 'Regular', color: '#e6eef8' });
      });
      return toJpeg(canvas);
    })().catch((error) => {
      heroPromise = null;
      throw error;
    });
  }
  return heroPromise;
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// abstracts: [{ code, title }]. The details are one HTML block because a person may have several selected abstracts.
const buildAbstractReminderEmail = async ({ fullName, abstracts }) => {
  const [hero, statics] = await Promise.all([getHero(), getStaticBands()]);
  const attachments = [
    { filename: 'ghc-reminder-hero.jpg', content: hero, contentType: 'image/jpeg', cid: 'rem-hero' },
    { filename: 'ghc-reminder-bottom.jpg', content: statics.bottom, contentType: 'image/jpeg', cid: 'rem-bottom' },
  ];
  const abstractDetails = abstracts
    .map(({ code, title }) => `<p style="color:#064e3b; font-size:17px; font-weight:700; line-height:1.5; margin:0 0 4px;">&ldquo;${escapeHtml(title)}&rdquo;</p><p style="color:#047857; font-size:12px; font-weight:700; letter-spacing:0.5px; margin:0 0 14px;">${escapeHtml(code)}</p>`)
    .join('');
  const variables = {
    name: escapeHtml(fullName),
    abstractLabel: abstracts.length > 1 ? 'Abstracts Selected' : 'Abstract Selected',
    abstractDetails,
    registerLink: escapeHtml(EVENT.url),
    eventDates: escapeHtml(EVENT.dates),
    venue: escapeHtml(EVENT.venue),
    helpEmails: escapeHtml([EVENT.helpTo, ...EVENT.helpCc].join(', ')),
    helpUrl: escapeHtml(`mailto:${EVENT.helpTo}?subject=${encodeURIComponent('GHC 2026 Abstract Registration Query')}`),
    heroHeight: px(BANDS.top[1] - BANDS.top[0]),
    bottomHeight: px(BANDS.bottom[1] - BANDS.bottom[0]),
  };
  return { attachments, variables };
};

module.exports = { buildAbstractReminderEmail };
