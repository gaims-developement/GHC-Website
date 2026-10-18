const path = require('path');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { EVENT, toJpeg } = require('./delegateEmailService');
const { getRegistrationUrl } = require('../config/links');

// The conclave invitation email is the GHC 2026 invitation poster (assets/email/invitation-poster.jpg), exported
// from the admin's Invitation Poster page with "Email artwork" selected. Its QR code already points to the Clirnet
// registration page. The poster is cut into horizontal bands sent as embedded (cid) images, like the registration
// confirmation email; the guest's name is painted into the gold nameplate, and the QR panel and the Register Now
// button are linked images. If the poster is re-exported, keep the 1200 x 1920 layout so the band positions below hold.
const ASSETS = path.join(__dirname, '..', 'assets');
const POSTER = path.join(ASSETS, 'email', 'invitation-poster.jpg');
GlobalFonts.registerFromPath(path.join(ASSETS, 'fonts', 'Cinzel.ttf'), 'GHCCinzel');

// Positions are in poster design units (1200 x 1920); band edges are multiples of 15 so they map to whole
// pixels at the 1280px render width (shown at 640px in the email, sharp on high-density screens).
const DESIGN_WIDTH = 1200;
const RENDER_WIDTH = 1280;
const EMAIL_WIDTH = 640;
const K = RENDER_WIDTH / DESIGN_WIDTH;
const BANDS = {
  top: [0, 1260], // header, Bharat Mandapam, headline and invitation copy
  name: [1260, 1425], // gold nameplate
  info: [1425, 1725], // highlights and the QR registration panel
  button: [1725, 1830], // Register Now
  bottom: [1830, 1920], // footer
};
const NAMEPLATE = { x: 190, y: 1288, w: 820, h: 112 };

let posterPromise = null;
const getPoster = () => {
  if (!posterPromise) posterPromise = loadImage(POSTER).catch((error) => { posterPromise = null; throw error; });
  return posterPromise;
};

// Crop a band (design units) out of the high-resolution poster, scaled to the render width.
const cropBand = (poster, [top, bottom], [left, right] = [0, DESIGN_WIDTH]) => {
  const ratio = poster.width / DESIGN_WIDTH;
  const canvas = createCanvas(Math.round((right - left) * K), Math.round((bottom - top) * K));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(poster, left * ratio, top * ratio, (right - left) * ratio, (bottom - top) * ratio, 0, 0, canvas.width, canvas.height);
  return canvas;
};

let staticPromise = null;
const getStaticBands = () => {
  if (!staticPromise) {
    staticPromise = getPoster()
      .then(async (poster) => ({
        top: await toJpeg(cropBand(poster, BANDS.top)),
        info: await toJpeg(cropBand(poster, BANDS.info)),
        button: await toJpeg(cropBand(poster, BANDS.button)),
        bottom: await toJpeg(cropBand(poster, BANDS.bottom)),
      }))
      .catch((error) => {
        staticPromise = null;
        throw error;
      });
  }
  return staticPromise;
};

// The nameplate band with the guest's name in gold Cinzel, shrunk to fit; very long names wrap onto two lines.
const renderNameBand = async (fullName) => {
  const canvas = cropBand(await getPoster(), BANDS.name);
  const ctx = canvas.getContext('2d');
  const plate = {
    x: NAMEPLATE.x * K,
    y: (NAMEPLATE.y - BANDS.name[0]) * K,
    w: NAMEPLATE.w * K,
    h: NAMEPLATE.h * K,
  };
  const name = String(fullName || '').replace(/\s+/g, ' ').trim() || 'Distinguished Guest';
  const maxWidth = plate.w * 0.86;

  const measure = (text, size) => {
    ctx.font = `${size}px GHCCinzel`;
    return ctx.measureText(text).width;
  };
  let lines = [name];
  let size = 60;
  while (size > 38 && measure(name, size) > maxWidth) size -= 1;
  if (measure(name, size) > maxWidth) {
    const mid = Math.floor(name.length / 2);
    const before = name.lastIndexOf(' ', mid);
    const after = name.indexOf(' ', mid);
    const cut = before > 0 && (after < 0 || mid - before <= after - mid) ? before : after;
    lines = cut > 0 ? [name.slice(0, cut), name.slice(cut + 1)] : [name];
    size = 40;
    while (size > 22 && Math.max(...lines.map((line) => measure(line, size))) > maxWidth) size -= 1;
  }

  ctx.font = `${size}px GHCCinzel`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const centerX = plate.x + plate.w / 2;
  const lineGap = size * 1.18;
  const firstY = plate.y + plate.h / 2 - ((lines.length - 1) * lineGap) / 2 + size * 0.04;
  lines.forEach((line, i) => {
    let text = line;
    while (ctx.measureText(text).width > maxWidth && text.length > 1) text = `${text.slice(0, -2)}…`;
    const y = firstY + i * lineGap;
    // Champagne-gold gradient over each line's own height.
    const gold = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
    gold.addColorStop(0, '#fff3cf');
    gold.addColorStop(0.5, '#f4c66a');
    gold.addColorStop(1, '#d9a441');
    ctx.shadowColor = 'rgba(244, 198, 106, 0.55)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = gold;
    ctx.fillText(text, centerX, y);
  });
  return toJpeg(canvas);
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shown = (designUnits) => Math.round((designUnits * EMAIL_WIDTH) / DESIGN_WIDTH);

// Inline (cid) images and template variables for one guest's invitation.
const buildInvitationEmail = async ({ fullName }) => {
  const [statics, nameBand] = await Promise.all([getStaticBands(), renderNameBand(fullName)]);
  const attachments = [
    { filename: 'ghc-invite-top.jpg', content: statics.top, contentType: 'image/jpeg', cid: 'inv-top' },
    { filename: 'ghc-invite-name.jpg', content: nameBand, contentType: 'image/jpeg', cid: 'inv-name' },
    { filename: 'ghc-invite-info.jpg', content: statics.info, contentType: 'image/jpeg', cid: 'inv-info' },
    { filename: 'ghc-invite-register.jpg', content: statics.button, contentType: 'image/jpeg', cid: 'inv-register' },
    { filename: 'ghc-invite-bottom.jpg', content: statics.bottom, contentType: 'image/jpeg', cid: 'inv-bottom' },
  ];
  const variables = {
    name: escapeHtml(fullName),
    eventDates: escapeHtml(EVENT.dates),
    venue: escapeHtml(EVENT.venue),
    registerLink: escapeHtml(getRegistrationUrl()),
    eventUrl: escapeHtml(EVENT.url),
    helpEmails: escapeHtml([EVENT.helpTo, ...EVENT.helpCc].join(', ')),
    helpUrl: escapeHtml(`mailto:${EVENT.helpTo}?subject=${encodeURIComponent('GHC 2026 Invitation Query')}`),
    topHeight: shown(BANDS.top[1] - BANDS.top[0]),
    nameHeight: shown(BANDS.name[1] - BANDS.name[0]),
    infoHeight: shown(BANDS.info[1] - BANDS.info[0]),
    buttonHeight: shown(BANDS.button[1] - BANDS.button[0]),
    bottomHeight: shown(BANDS.bottom[1] - BANDS.bottom[0]),
  };
  return { attachments, variables };
};

module.exports = { buildInvitationEmail };
