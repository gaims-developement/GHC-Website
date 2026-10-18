const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
// Requiring delegateEmailService also registers the GHCPoppins* fonts.
const { fitText, roundedRect, toJpeg } = require('./delegateEmailService');

// Hero for the Delegate WhatsApp group email: the real Bharat Mandapam photo under a navy wash, with the
// headline painted on. It has no personal details, so it is rendered once and reused for every email.
const VENUE_PHOTO = path.join(__dirname, '..', 'assets', 'email', 'bharat-mandapam.png');
const WIDTH = 1280; // shown at 640px in the email, so it stays sharp on high-density screens
const HEIGHT = 1000;
const PHOTO_TOP = 196; // navy sky above the photo holds the headline
const WHATSAPP_GREEN = '#25D366';

// Simplified WhatsApp mark: green disc with a speech-bubble tail and a white handset.
const drawWhatsappMark = (ctx, cx, cy, r) => {
  ctx.save();
  ctx.fillStyle = WHATSAPP_GREEN;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = r * 0.11;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, Math.PI * 0.72, Math.PI * 2.62);
  ctx.lineTo(cx - r * 0.62, cy + r * 0.66);
  ctx.closePath();
  ctx.stroke();
  // Handset: a thick arc with rounded ends, earpiece top-left and mouthpiece bottom-right.
  ctx.lineWidth = r * 0.19;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx + r * 0.1, cy - r * 0.1, r * 0.3, Math.PI * 0.3, Math.PI * 1.2);
  ctx.stroke();
  ctx.restore();
};

const renderHero = async () => {
  const photo = await loadImage(VENUE_PHOTO);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Full-width photo below a navy sky; the wash blends the two and darkens the bottom for the venue line.
  ctx.fillStyle = '#06112b';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(photo, 0, PHOTO_TOP, WIDTH, photo.height * (WIDTH / photo.width));
  const wash = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  wash.addColorStop(0, 'rgba(6, 17, 43, 1)');
  wash.addColorStop(0.2, 'rgba(6, 17, 43, 1)');
  wash.addColorStop(0.36, 'rgba(8, 24, 60, 0.35)');
  wash.addColorStop(0.6, 'rgba(8, 24, 60, 0)');
  wash.addColorStop(0.78, 'rgba(6, 17, 43, 0.55)');
  wash.addColorStop(1, 'rgba(4, 12, 32, 0.97)');
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Brand stripe along the very top.
  const stripe = ctx.createLinearGradient(0, 0, WIDTH, 0);
  stripe.addColorStop(0, '#4F46E5');
  stripe.addColorStop(0.5, '#A43BD9');
  stripe.addColorStop(1, '#EC4899');
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, WIDTH, 10);

  // Eyebrow pill.
  ctx.font = '22px GHCPoppinsSemiBold';
  const eyebrow = 'GLOBAL HEALTHCARE CONCLAVE 2026';
  const pillWidth = ctx.measureText(eyebrow).width + 96;
  roundedRect(ctx, (WIDTH - pillWidth) / 2, 56, pillWidth, 54, 27);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = WHATSAPP_GREEN;
  ctx.beginPath();
  ctx.arc((WIDTH - pillWidth) / 2 + 36, 83, 7, 0, Math.PI * 2);
  ctx.fill();
  fitText(ctx, eyebrow, { x: (WIDTH - pillWidth) / 2 + 58, y: 91, maxWidth: pillWidth, size: 22, weight: 'SemiBold', color: '#ffffff' });

  // Headline.
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 24;
  fitText(ctx, 'You’re Invited', { x: WIDTH / 2, y: 214, maxWidth: 1100, size: 96, weight: 'Bold', color: '#ffffff', align: 'center' });
  const accent = ctx.createLinearGradient(260, 0, 1020, 0);
  accent.addColorStop(0, '#8fd6f6');
  accent.addColorStop(1, '#c4b5fd');
  fitText(ctx, 'to the Delegate WhatsApp Group', { x: WIDTH / 2, y: 290, maxWidth: 1100, size: 52, weight: 'SemiBold', color: accent, align: 'center' });
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';

  // WhatsApp mark sitting on the lower edge, with a soft glow.
  ctx.save();
  ctx.shadowColor = 'rgba(37, 211, 102, 0.65)';
  ctx.shadowBlur = 40;
  drawWhatsappMark(ctx, WIDTH / 2, 830, 46);
  ctx.restore();

  // Venue and dates.
  fitText(ctx, 'BHARAT MANDAPAM  ·  NEW DELHI', { x: WIDTH / 2, y: 924, maxWidth: 1100, size: 26, weight: 'SemiBold', color: '#ffffff', align: 'center' });
  fitText(ctx, '28 – 29 November 2026', { x: WIDTH / 2, y: 964, maxWidth: 1100, size: 24, weight: 'Regular', color: '#cbd5f5', align: 'center' });

  return toJpeg(canvas);
};

let heroPromise = null;
const getHero = () => {
  if (!heroPromise) heroPromise = renderHero().catch((error) => { heroPromise = null; throw error; });
  return heroPromise;
};

const buildWhatsappInviteAttachments = async () => [
  { filename: 'ghc-whatsapp-hero.jpg', content: await getHero(), contentType: 'image/jpeg', cid: 'wa-hero' },
];

module.exports = { buildWhatsappInviteAttachments, HERO_HEIGHT: HEIGHT / 2 };
