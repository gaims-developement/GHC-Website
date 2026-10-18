const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { getDelegateWhatsappGroupUrl } = require('../config/links');

// The confirmation email is the designer's artwork (assets/email/source-design.png, 1024x1536) cut into
// horizontal bands. Personal details are painted onto the artwork where the design had {{placeholders}}.
const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSETS, 'email', 'source-design.png');

['Regular', 'SemiBold', 'Bold'].forEach((weight) => {
  GlobalFonts.registerFromPath(path.join(ASSETS, 'fonts', `Poppins-${weight}.ttf`), `GHCPoppins${weight}`);
});

const EVENT = {
  title: 'Global Healthcare Conclave 2026',
  dates: '28 – 29 November 2026',
  headerDates: '28 - 29 November 2026',
  venue: 'Bharat Mandapam, New Delhi, India',
  paymentStatus: 'Paid',
  category: 'Delegate',
  url: 'https://ghc.gaims.org/',
  helpTo: 'secretary@gaims.org',
  helpCc: ['vpi@gaims.org', 'it@gaims.org'],
};

// Band boundaries are multiples of 8 so they scale to whole pixels at the 640px email width (factor 0.625).
const EMAIL_WIDTH = 640;
const SCALE = EMAIL_WIDTH / 1024;
const BANDS = {
  top: [0, 504],
  details: [504, 944],
  buttons: [944, 1048],
  bottom: [1048, 1536],
};
const BUTTON_COLUMNS = [[0, 368], [368, 664], [664, 1024]];

const NAVY = '#0e1a36';

let sourcePromise = null;
const getSource = () => {
  if (!sourcePromise) sourcePromise = loadImage(SOURCE);
  return sourcePromise;
};

// Repaint a rectangle by interpolating, row by row, between the pixels just left and right of it.
// Erases the old text while keeping the artwork's soft gradients.
const erase = (ctx, x, y, w, h) => {
  const left = ctx.getImageData(x - 2, y, 1, h).data;
  const right = ctx.getImageData(x + w + 1, y, 1, h).data;
  const patch = ctx.createImageData(w, h);
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < w; col += 1) {
      const t = col / Math.max(1, w - 1);
      const i = (row * w + col) * 4;
      for (let k = 0; k < 3; k += 1) patch.data[i + k] = Math.round(left[row * 4 + k] * (1 - t) + right[row * 4 + k] * t);
      patch.data[i + 3] = 255;
    }
  }
  ctx.putImageData(patch, x, y);
};

// Draw text shrinking it (down to minSize) to fit maxWidth; truncate with an ellipsis as a last resort.
const fitText = (ctx, text, { x, y, maxWidth, size, minSize = 10, weight = 'Bold', color = NAVY, align = 'left' }) => {
  let fontSize = size;
  let value = String(text || '');
  ctx.font = `${fontSize}px GHCPoppins${weight}`;
  while (ctx.measureText(value).width > maxWidth && fontSize > minSize) {
    fontSize -= 0.5;
    ctx.font = `${fontSize}px GHCPoppins${weight}`;
  }
  while (ctx.measureText(value).width > maxWidth && value.length > 1) value = `${value.slice(0, -2)}…`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(value, x, y);
  return ctx.measureText(value).width;
};

// One line if it fits at >= singleMinSize, otherwise wrap onto two lines (at a space, or before "@").
const fitTwoLines = (ctx, text, { x, y, maxWidth, size, singleMinSize, lineGap, ...rest }) => {
  const value = String(text || '');
  ctx.font = `${singleMinSize}px GHCPoppins${rest.weight || 'Bold'}`;
  if (ctx.measureText(value).width <= maxWidth) {
    fitText(ctx, value, { x, y, maxWidth, size, minSize: singleMinSize, ...rest });
    return;
  }
  let cut = value.indexOf('@');
  if (cut <= 0) {
    const mid = Math.floor(value.length / 2);
    const before = value.lastIndexOf(' ', mid);
    const after = value.indexOf(' ', mid);
    cut = before > 0 && (after < 0 || mid - before <= after - mid) ? before : after;
  }
  if (cut <= 0) cut = Math.floor(value.length / 2);
  const lineSize = singleMinSize;
  fitText(ctx, value.slice(0, cut).trim(), { x, y, maxWidth, size: lineSize, ...rest });
  fitText(ctx, value.slice(cut).trim(), { x, y: y + lineGap, maxWidth, size: lineSize, ...rest });
};

// Draw text letter by letter with extra tracking (the design's wide-spaced caption style).
const drawSpaced = (ctx, text, { x, y, size, spacing, color, weight = 'Regular' }) => {
  ctx.font = `${size}px GHCPoppins${weight}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
};

const roundedRect =(ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Real Bharat Mandapam photo, recoloured into the template's light-blue palette, in the "What's Next" panel.
const VENUE_PHOTO = path.join(ASSETS, 'email', 'bharat-mandapam.png');
const PANEL = { x: 62, y: 1068, w: 538, h: 279, radius: 14, fadeFrom: 455, fadeTo: 578 };

const hex = (value) => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
const SHADOW = hex('#16365c');
const HIGHLIGHT = hex('#eef4fb');

const drawVenuePanel = async (ctx, by) => {
  const photo = await loadImage(VENUE_PHOTO);
  const { x, w, h, radius, fadeFrom, fadeTo } = PANEL;
  const y = by(PANEL.y);

  // Cover-fit crop of the photo, keeping the building slightly left of centre like the original artwork.
  const cropW = 1180;
  const cropH = Math.round((cropW * h) / w);
  const layer = createCanvas(w, h);
  const lctx = layer.getContext('2d');
  lctx.drawImage(photo, 271, 70, cropW, cropH, 0, 0, w, h);

  // Duotone grade: luminance mapped from navy shadows to pale-blue highlights, lifted to keep it airy.
  const img = lctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const t = Math.min(1, 0.45 + 0.68 * lum ** 0.8);
    for (let k = 0; k < 3; k += 1) d[i + k] = Math.round(SHADOW[k] + (HIGHLIGHT[k] - SHADOW[k]) * t);
  }
  lctx.putImageData(img, 0, 0);

  // The artwork's soft decorative circles.
  lctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  lctx.beginPath();
  lctx.arc(250 - x, 1150 - PANEL.y, 140, 0, Math.PI * 2);
  lctx.fill();
  lctx.fillStyle = 'rgba(96, 150, 205, 0.20)';
  lctx.beginPath();
  lctx.arc(470 - x, 1320 - PANEL.y, 190, 0, Math.PI * 2);
  lctx.fill();

  // Fade the right edge into the panel background, as the original photo did.
  lctx.globalCompositeOperation = 'destination-in';
  const fade = lctx.createLinearGradient(fadeFrom - x, 0, fadeTo - x, 0);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  lctx.fillStyle = fade;
  lctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = 'source-over';

  // Clear the old photo to the panel's background colour: per row, the lightest pixel of the text column
  // to the right (text is darker than the background, so the lightest pixel is always plain background).
  const sample = ctx.getImageData(fadeTo + 4, y, 360, h).data;
  const bg = new Uint8ClampedArray(h * 4);
  for (let row = 0; row < h; row += 1) {
    let best = -1;
    for (let col = 0; col < 360; col += 1) {
      const i = (row * 360 + col) * 4;
      const sum = sample[i] + sample[i + 1] + sample[i + 2];
      if (sum > best) {
        best = sum;
        bg.set([sample[i], sample[i + 1], sample[i + 2], 255], row * 4);
      }
    }
  }
  const width = fadeTo + 2 - x;
  const clear = ctx.createImageData(width, h);
  for (let row = 0; row < h; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const i = (row * width + col) * 4;
      clear.data[i] = bg[row * 4];
      clear.data[i + 1] = bg[row * 4 + 1];
      clear.data[i + 2] = bg[row * 4 + 2];
      clear.data[i + 3] = 255;
    }
  }
  const cleared = createCanvas(width, h);
  cleared.getContext('2d').putImageData(clear, 0, 0);

  // Remove the old photo's anti-aliased edge just outside the panel by repainting a 3px margin with the page background.
  const margin = 3;
  const pageBg = ctx.getImageData(x - margin - 6, y - margin, 1, h + margin * 2).data;
  ctx.save();
  roundedRect(ctx, x - margin, y - margin, width + margin, h + margin * 2, radius + margin);
  ctx.clip();
  for (let row = 0; row < h + margin * 2; row += 1) {
    ctx.fillStyle = `rgb(${pageBg[row * 4]}, ${pageBg[row * 4 + 1]}, ${pageBg[row * 4 + 2]})`;
    ctx.fillRect(x - margin, y - margin + row, width + margin, 1);
  }
  ctx.restore();

  ctx.save();
  roundedRect(ctx, x, y, width, h, radius);
  ctx.clip();
  ctx.drawImage(cleared, x, y);
  ctx.drawImage(layer, x, y);
  ctx.restore();
};

// Hero: replace the illustrated building in front of the globe with the real Bharat Mandapam,
// graded to the hero's night palette (deep navy -> blue -> pale glowing highlights).
const HERO = { x: 584, bottom: 480, width: 284 };
const HAZE = { cx: 727, cy: 428, rx: 186, ry: 92, color: 'rgba(6, 24, 47, 1)' };
const SCRIPT_REGION = { x: 860, y: 340, w: 164, h: 164 }; // "See you in New Delhi" lettering
const HERO_PHOTO = { x: 355, y: 230, w: 880, h: 330 }; // building + statue region of the venue photo
const NIGHT = [hex('#04112a'), hex('#1d4b82'), hex('#e3f1ff')];

const drawHeroVenue = async (ctx) => {
  const photo = await loadImage(VENUE_PHOTO);
  const s = HERO.width / HERO_PHOTO.w;
  const w = HERO.width;
  const h = Math.round(HERO_PHOTO.h * s);
  const top = HERO.bottom - h;

  // 1. Hide the old building under a soft night haze (feathered dark ellipse) that fades into the sky and water.
  //    The "See you in New Delhi" script to the right is kept from the original artwork (restored in step 5).
  const original = createCanvas(ctx.canvas.width, ctx.canvas.height);
  original.getContext('2d').drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.translate(HAZE.cx, HAZE.cy);
  ctx.scale(HAZE.rx / HAZE.ry, 1);
  const haze = ctx.createRadialGradient(0, 0, 0, 0, 0, HAZE.ry);
  haze.addColorStop(0, HAZE.color);
  haze.addColorStop(0.76, HAZE.color);
  haze.addColorStop(1, 'rgba(6, 24, 47, 0)');
  ctx.fillStyle = haze;
  ctx.beginPath();
  ctx.arc(0, 0, HAZE.ry, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Building layer, graded with a three-stop night gradient map.
  const layer = createCanvas(w, h);
  const lctx = layer.getContext('2d');
  lctx.drawImage(photo, HERO_PHOTO.x, HERO_PHOTO.y, HERO_PHOTO.w, HERO_PHOTO.h, 0, 0, w, h);
  const img = lctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
    const t = Math.min(1, lum ** 0.9 * 1.15);
    const [a, b, u] = t < 0.5 ? [NIGHT[0], NIGHT[1], t / 0.5] : [NIGHT[1], NIGHT[2], (t - 0.5) / 0.5];
    for (let k = 0; k < 3; k += 1) d[i + k] = Math.round(a[k] + (b[k] - a[k]) * u);
  }
  lctx.putImageData(img, 0, 0);

  // 3. Soft silhouette mask: the elliptical roof plus the body below it, fading out at the base.
  const mask = createCanvas(w, h);
  const mctx = mask.getContext('2d');
  mctx.filter = 'blur(2.5px)';
  mctx.fillStyle = '#000';
  const P = (px, py) => [(px - HERO_PHOTO.x) * s, (py - HERO_PHOTO.y) * s];
  const [ex, ey] = P(792, 372);
  mctx.beginPath();
  mctx.ellipse(ex, ey, 432 * s, 118 * s, 0, 0, Math.PI * 2);
  mctx.fill();
  const [rx, ry] = P(362, 372);
  mctx.fillRect(rx, ry, 860 * s, h - ry);
  mctx.filter = 'none';
  mctx.globalCompositeOperation = 'destination-in';
  const base = mctx.createLinearGradient(0, h * 0.82, 0, h);
  base.addColorStop(0, 'rgba(0,0,0,1)');
  base.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = base;
  mctx.fillRect(0, 0, w, h);
  lctx.globalCompositeOperation = 'destination-in';
  lctx.drawImage(mask, 0, 0);
  lctx.globalCompositeOperation = 'source-over';

  // 4. Faint reflection in the water, then the building itself.
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.translate(HERO.x, HERO.bottom * 2 - 6);
  ctx.scale(1, -1);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
  ctx.drawImage(layer, HERO.x, top);

  // 5. Bring back the original lettering/scenery on the right wherever it is brighter than the haze.
  ctx.save();
  ctx.globalCompositeOperation = 'lighten';
  const { x: sx, y: sy, w: sw, h: sh } = SCRIPT_REGION;
  ctx.drawImage(original, sx, sy, sw, sh, sx, sy, sw, sh);
  ctx.restore();
};

const cropBand = (source, [top, bottom], [left, right] = [0, 1024]) => {
  const canvas = createCanvas(right - left, bottom - top);
  canvas.getContext('2d').drawImage(source, left, top, right - left, bottom - top, 0, 0, right - left, bottom - top);
  return canvas;
};

const toJpeg = (canvas) => canvas.encode('jpeg', 88);

// The top band with the corrected header dates and the real Bharat Mandapam in the hero. Shared with the
// conclave invitation email (services/invitationImageService.js), which rewords the hero text on a copy.
let topCanvasPromise = null;
const getTopCanvas = () => {
  if (!topCanvasPromise) {
    topCanvasPromise = (async () => {
      const source = await getSource();
      const top = cropBand(source, BANDS.top);
      const ctx = top.getContext('2d');
      erase(ctx, 795, 41, 152, 23);
      fitText(ctx, EVENT.headerDates, { x: 797, y: 57, maxWidth: 150, size: 12, weight: 'Bold' });
      await drawHeroVenue(ctx);
      return top;
    })().catch((error) => {
      topCanvasPromise = null;
      throw error;
    });
  }
  return topCanvasPromise;
};

// Static bands are identical for every delegate, so they are rendered once per process.
let staticPromise = null;
const getStaticBands = () => {
  if (!staticPromise) {
    staticPromise = (async () => {
      const source = await getSource();
      const top = await getTopCanvas();

      const buttons = await Promise.all(BUTTON_COLUMNS.map((cols) => toJpeg(cropBand(source, BANDS.buttons, cols))));

      // Replace the "PEOPLE / IDEAS / INNOVATION / IMPACT" caption with the venue, in the same letter-spaced style.
      const bottom = cropBand(source, BANDS.bottom);
      const bctx = bottom.getContext('2d');
      const by = (y) => y - BANDS.bottom[0];
      await drawVenuePanel(bctx, by);
      drawSpaced(bctx, 'BHARAT', { x: 92, y: by(1111), size: 14, spacing: 9.5, color: '#5b8bbc' });
      drawSpaced(bctx, 'MANDAPAM', { x: 92, y: by(1131), size: 14, spacing: 9.5, color: '#5b8bbc' });

      return {
        top: await toJpeg(top),
        buttons,
        bottom: await toJpeg(bottom),
      };
    })().catch((error) => {
      staticPromise = null;
      throw error;
    });
  }
  return staticPromise;
};

const renderDetailsBand = async ({ fullName, registrationId, email, checkinToken }) => {
  const source = await getSource();
  const canvas = cropBand(source, BANDS.details);
  const ctx = canvas.getContext('2d');
  const oy = BANDS.details[0];
  const Y = (y) => y - oy;

  // "Dear {{participant_name}},"
  erase(ctx, 119, Y(541), 236, 33);
  const nameWidth = fitText(ctx, fullName, { x: 121, y: Y(565), maxWidth: 560, size: 19 });
  fitText(ctx, ',', { x: 121 + nameWidth, y: Y(565), maxWidth: 20, size: 19 });

  // QR code (encodes the delegate's private check-in token, not the guessable registration ID)
  erase(ctx, 108, Y(714), 126, 130);
  const qr = await loadImage(await QRCode.toBuffer(checkinToken, { errorCorrectionLevel: 'M', margin: 1, width: 360, color: { dark: '#0b1220', light: '#ffffff' } }));
  ctx.drawImage(qr, 111, Y(717), 120, 120);

  // {{registration_id}}
  erase(ctx, 92, Y(851), 164, 26);
  fitText(ctx, registrationId, { x: 174, y: Y(869), maxWidth: 158, size: 15, align: 'center' });

  // Participant {{participant_name}}
  erase(ctx, 391, Y(729), 262, 22);
  fitTwoLines(ctx, fullName, { x: 394, y: Y(745), maxWidth: 255, size: 16, singleMinSize: 13, lineGap: 17, minSize: 10 });

  // Event dates (design said 22 – 24)
  erase(ctx, 391, Y(800), 262, 25);
  fitText(ctx, EVENT.dates, { x: 394, y: Y(817), maxWidth: 255, size: 16 });

  // Payment status pill
  erase(ctx, 755, Y(724), 200, 39);
  ctx.font = '12px GHCPoppinsSemiBold';
  const pillWidth = ctx.measureText(EVENT.paymentStatus).width + 28;
  roundedRect(ctx, 759, Y(729), pillWidth, 29, 7);
  ctx.fillStyle = '#dcf5e3';
  ctx.fill();
  ctx.strokeStyle = '#b9e6c6';
  ctx.lineWidth = 1;
  ctx.stroke();
  fitText(ctx, EVENT.paymentStatus, { x: 759 + pillWidth / 2, y: Y(748), maxWidth: pillWidth, size: 12, weight: 'SemiBold', color: '#0f7a32', align: 'center' });

  // Registration category
  erase(ctx, 757, Y(803), 205, 25);
  fitText(ctx, EVENT.category, { x: 761, y: Y(819), maxWidth: 200, size: 16 });

  // Registered email
  erase(ctx, 757, Y(876), 205, 25);
  fitTwoLines(ctx, email, { x: 761, y: Y(893), maxWidth: 200, size: 15, singleMinSize: 12, lineGap: 16, minSize: 9 });

  return toJpeg(canvas);
};

const calendarUrl = () => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: EVENT.title,
    dates: '20261128/20261130',
    location: EVENT.venue,
    details: `${EVENT.title} — ${EVENT.dates}, ${EVENT.venue}. ${EVENT.url}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const helpUrl = (registrationId) =>
  `mailto:${EVENT.helpTo}?cc=${EVENT.helpCc.join(',')}&subject=${encodeURIComponent(`GHC 2026 Registration Query — ${registrationId}`)}`;

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const px = (n) => Math.round(n * SCALE);

// Builds the attachments (inline cid images) and the variables used by the email template.
const buildConfirmationEmail = async (delegate) => {
  const [statics, details] = await Promise.all([getStaticBands(), renderDetailsBand(delegate)]);
  const attachments = [
    { filename: 'ghc-top.jpg', content: statics.top, contentType: 'image/jpeg', cid: 'ghc-top' },
    { filename: 'ghc-details.jpg', content: details, contentType: 'image/jpeg', cid: 'ghc-details' },
    ...statics.buttons.map((content, i) => ({ filename: `ghc-button-${i + 1}.jpg`, content, contentType: 'image/jpeg', cid: `ghc-button-${i + 1}` })),
    { filename: 'ghc-bottom.jpg', content: statics.bottom, contentType: 'image/jpeg', cid: 'ghc-bottom' },
  ];

  const variables = {
    fullName: escapeHtml(delegate.fullName),
    registrationId: escapeHtml(delegate.registrationId),
    email: escapeHtml(delegate.email),
    eventDates: escapeHtml(EVENT.dates),
    venue: escapeHtml(EVENT.venue),
    paymentStatus: escapeHtml(EVENT.paymentStatus),
    category: escapeHtml(EVENT.category),
    calendarUrl: escapeHtml(calendarUrl()),
    eventUrl: escapeHtml(EVENT.url),
    helpUrl: escapeHtml(helpUrl(delegate.registrationId)),
    helpEmails: escapeHtml([EVENT.helpTo, ...EVENT.helpCc].join(', ')),
    whatsappLink: escapeHtml(getDelegateWhatsappGroupUrl()),
    topHeight: px(BANDS.top[1] - BANDS.top[0]),
    detailsHeight: px(BANDS.details[1] - BANDS.details[0]),
    buttonsHeight: px(BANDS.buttons[1] - BANDS.buttons[0]),
    bottomHeight: px(BANDS.bottom[1] - BANDS.bottom[0]),
    button1Width: px(BUTTON_COLUMNS[0][1] - BUTTON_COLUMNS[0][0]),
    button2Width: px(BUTTON_COLUMNS[1][1] - BUTTON_COLUMNS[1][0]),
    button3Width: px(BUTTON_COLUMNS[2][1] - BUTTON_COLUMNS[2][0]),
  };
  return { attachments, variables };
};

module.exports = {
  buildConfirmationEmail,
  renderDetailsBand,
  getStaticBands,
  EVENT,
  erase,
  // Shared with the conclave invitation email, which reuses this design.
  BANDS,
  BUTTON_COLUMNS,
  SCALE,
  getSource,
  getTopCanvas,
  cropBand,
  fitText,
  fitTwoLines,
  roundedRect,
  toJpeg,
  calendarUrl,
};
