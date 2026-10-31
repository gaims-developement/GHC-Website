const { createCanvas } = require('@napi-rs/canvas');
const { BANDS, EVENT, SCALE, erase, fitText, getStaticBands, getTopCanvas, toJpeg } = require('./delegateEmailService');

// Photo ID request for registered delegates, reusing the registration artwork like the abstract reminder does.
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
      fitText(ctx, 'Photo ID Required', { x: 86, y: 288, maxWidth: 480, size: 62, color: '#ffffff' });
      const blue = ctx.createLinearGradient(86, 0, 520, 0);
      blue.addColorStop(0, '#9fe3f7');
      blue.addColorStop(1, '#5b8fe0');
      fitText(ctx, 'For Venue Entry', { x: 86, y: 360, maxWidth: 480, size: 62, color: blue });
      ['Please submit your ID before the', 'conclave so we can verify you at entry.'].forEach((line, i) => {
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

const buildDelegateIdEmail = async ({ fullName, formLink }) => {
  const [hero, statics] = await Promise.all([getHero(), getStaticBands()]);
  const attachments = [
    { filename: 'ghc-id-hero.jpg', content: hero, contentType: 'image/jpeg', cid: 'id-hero' },
    { filename: 'ghc-id-bottom.jpg', content: statics.bottom, contentType: 'image/jpeg', cid: 'id-bottom' },
  ];
  const variables = {
    name: escapeHtml(fullName),
    formLink: escapeHtml(formLink),
    eventDates: escapeHtml(EVENT.dates),
    venue: escapeHtml(EVENT.venue),
    helpEmails: escapeHtml([EVENT.helpTo, ...EVENT.helpCc].join(', ')),
    helpUrl: escapeHtml(`mailto:${EVENT.helpTo}?subject=${encodeURIComponent('GHC 2026 Photo ID Query')}`),
    heroHeight: px(BANDS.top[1] - BANDS.top[0]),
    bottomHeight: px(BANDS.bottom[1] - BANDS.bottom[0]),
  };
  return { attachments, variables };
};

module.exports = { buildDelegateIdEmail };
