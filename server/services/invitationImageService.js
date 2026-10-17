const path = require('path');
const QRCode = require('qrcode');
const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
// Loading the delegate email service also registers the Poppins fonts (GHCPoppins*) used below.
const { erase } = require('./delegateEmailService');
const { getRegistrationUrl } = require('../config/links');

// The conclave invitation email is the designed poster (assets/email/invitation-source.png, 1024x1536), kept as
// designed and cut into horizontal bands. Only these are painted over it: the corrected dates, the recipient's
// name (in place of "Your Name Here" and the designation line) and a real QR code to the registration page.
// The band holding the poster's "Register Now" button is sliced into columns so it can be linked.
const ASSETS = path.join(__dirname, '..', 'assets');
const SOURCE = path.join(ASSETS, 'email', 'invitation-source.png');

GlobalFonts.registerFromPath(path.join(ASSETS, 'fonts', 'GreatVibes-Regular.ttf'), 'InviteScript');

const WIDTH = 1024;
const HEIGHT = 1536;
// Band edges are multiples of 8 so they scale to whole pixels at the 640px email width (factor 0.625).
const EMAIL_WIDTH = 640;
const BANDS = {
  top: [0, 1264],
  cta: [1264, 1312],
  bottom: [1312, HEIGHT],
};
// The middle column is exactly the poster's "Register Now" button.
const CTA_COLUMNS = [[0, 488], [488, 712], [712, 1024]];
const QR_BOX = { x: 310, y: 1170, w: 139, h: 137 };

const roundedRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Shrink the font until the text fits maxWidth.
const fitFont = (ctx, text, family, size, maxWidth, minSize) => {
  let fontSize = size;
  ctx.font = `${fontSize}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && fontSize > minSize) {
    fontSize -= 0.5;
    ctx.font = `${fontSize}px ${family}`;
  }
  return fontSize;
};

// Text drawn glyph by glyph with extra tracking (the poster's wide-spaced caption style).
const drawTracked = (ctx, text, { x, y, spacing }) => {
  let cursor = x;
  ctx.textAlign = 'left';
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + spacing;
  }
};

// Everything except the recipient's name: drawn once per process and reused.
const renderBase = async () => {
  const source = await loadImage(SOURCE);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(source, 0, 0, WIDTH, HEIGHT);

  // Dates: "22 – 24 / JANUARY 2026" -> "28 – 29 / NOVEMBER 2026".
  erase(ctx, 770, 42, 168, 46);
  ctx.fillStyle = '#e8ebf2';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '19px GHCPoppinsRegular';
  drawTracked(ctx, '28 – 29', { x: 775, y: 63, spacing: 1.2 });
  drawTracked(ctx, 'NOVEMBER 2026', { x: 775, y: 84, spacing: 1.2 });

  // Name panel: clear "Your Name Here" and the designation line (the name is drawn per recipient).
  erase(ctx, 215, 918, 595, 112);
  const ruleY = 1010;
  for (const [from, to] of [[300, 504], [520, 724]]) {
    const gradient = ctx.createLinearGradient(from, 0, to, 0);
    gradient.addColorStop(from < 512 ? 0 : 1, 'rgba(212,165,90,0)');
    gradient.addColorStop(from < 512 ? 1 : 0, 'rgba(232,190,110,0.95)');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(from, ruleY);
    ctx.lineTo(to, ruleY);
    ctx.stroke();
  }
  ctx.fillStyle = '#f1cf86';
  ctx.beginPath();
  ctx.arc(512, ruleY, 3.2, 0, Math.PI * 2);
  ctx.fill();

  // Replace the poster's placeholder QR with a real one that opens the registration page.
  roundedRect(ctx, QR_BOX.x, QR_BOX.y, QR_BOX.w, QR_BOX.h, 10);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  const qr = await loadImage(await QRCode.toBuffer(getRegistrationUrl(), {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 480,
    color: { dark: '#0b1220', light: '#ffffff' },
  }));
  const qrSize = 117;
  ctx.drawImage(qr, QR_BOX.x + (QR_BOX.w - qrSize) / 2, QR_BOX.y + (QR_BOX.h - qrSize) / 2, qrSize, qrSize);

  return canvas;
};

const crop = (source, x, y, w, h) => {
  const canvas = createCanvas(w, h);
  canvas.getContext('2d').drawImage(source, x, y, w, h, 0, 0, w, h);
  return canvas;
};

// Quality 84 keeps the photo crisp while holding each email to roughly 400 KB of images.
const encode = (canvas) => canvas.encode('jpeg', 84);

let basePromise = null;
let staticBandsPromise = null;
const getBase = () => {
  if (!basePromise) basePromise = renderBase();
  return basePromise;
};

// The call-to-action row and the bottom of the poster are the same for everyone, so they are encoded once.
const getStaticBands = () => {
  if (!staticBandsPromise) {
    staticBandsPromise = getBase().then(async (base) => {
      const [y0, y1] = BANDS.cta;
      const cta = await Promise.all(CTA_COLUMNS.map(([x0, x1]) => encode(crop(base, x0, y0, x1 - x0, y1 - y0))));
      const bottom = await encode(crop(base, 0, BANDS.bottom[0], WIDTH, BANDS.bottom[1] - BANDS.bottom[0]));
      return { cta, bottom };
    });
  }
  return staticBandsPromise;
};

// Top band with the recipient's name written in gold script, centred in the poster's name panel.
const renderTopBand = async (fullName) => {
  const base = await getBase();
  const [y0, y1] = BANDS.top;
  const canvas = crop(base, 0, y0, WIDTH, y1 - y0);
  const ctx = canvas.getContext('2d');
  const name = String(fullName || 'Valued Guest').trim();
  const size = fitFont(ctx, name, 'InviteScript', 72, 560, 34);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  const gradient = ctx.createLinearGradient(0, 930, 0, 995);
  gradient.addColorStop(0, '#f6dc9c');
  gradient.addColorStop(1, '#d9a24f');
  ctx.fillStyle = gradient;
  ctx.font = `${size}px InviteScript`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(name, WIDTH / 2, 988);
  ctx.restore();
  return encode(canvas);
};

const toEmail = (n) => Math.round(n * (EMAIL_WIDTH / WIDTH));

// Inline (cid) attachments for one recipient's invitation, plus the pixel sizes the email template needs.
const buildInvitationImages = async (fullName) => {
  const [top, statics] = await Promise.all([renderTopBand(fullName), getStaticBands()]);
  const attachments = [
    { filename: 'invitation.jpg', content: top, contentType: 'image/jpeg', cid: 'inv-top' },
    ...statics.cta.map((content, i) => ({ filename: `invitation-cta-${i + 1}.jpg`, content, contentType: 'image/jpeg', cid: `inv-cta-${i + 1}` })),
    { filename: 'invitation-footer.jpg', content: statics.bottom, contentType: 'image/jpeg', cid: 'inv-bottom' },
  ];
  const sizes = {
    emailWidth: EMAIL_WIDTH,
    topHeight: toEmail(BANDS.top[1] - BANDS.top[0]),
    ctaHeight: toEmail(BANDS.cta[1] - BANDS.cta[0]),
    bottomHeight: toEmail(BANDS.bottom[1] - BANDS.bottom[0]),
    cta1Width: toEmail(CTA_COLUMNS[0][1] - CTA_COLUMNS[0][0]),
    cta2Width: toEmail(CTA_COLUMNS[1][1] - CTA_COLUMNS[1][0]),
    cta3Width: toEmail(CTA_COLUMNS[2][1] - CTA_COLUMNS[2][0]),
  };
  return { attachments, sizes };
};

module.exports = { buildInvitationImages, renderBase };
