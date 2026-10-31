const { Path2D, createCanvas } = require('@napi-rs/canvas');
const { EVENT, getSource } = require('./delegateEmailService');

// Artwork for the photo ID request. Email clients drop inline SVG, so the icons are drawn once and attached as PNGs.
const NAVY = '#0f2147';
const BLUE = '#1e3a7a';
const toPng = (canvas) => canvas.encode('png');

// Lucide icon outlines on their 24px grid.
const ICONS = {
  name: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0a4 4 0 1 1 8 0'],
  email: ['M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'],
  registration: ['M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z', 'M13 5v2', 'M13 17v2', 'M13 11v2'],
  photo: ['M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M16 10h2', 'M16 14h2', 'M6.17 15a3 3 0 0 1 5.66 0', 'M11 11a2 2 0 1 1-4 0a2 2 0 1 1 4 0'],
  calendar: ['M8 2v4', 'M16 2v4', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z', 'M3 10h18'],
};

const drawIcon = (paths) => {
  const size = 72;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 1.75;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paths.forEach((d) => ctx.stroke(new Path2D(d)));
  return toPng(canvas);
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
};

const drawHeader = async () => {
  const canvas = createCanvas(1280, 240);
  const ctx = canvas.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 1280, 240);
  sky.addColorStop(0, '#0b1a3c');
  sky.addColorStop(0.6, NAVY);
  sky.addColorStop(1, '#1f4a93');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1280, 240);

  ctx.strokeStyle = 'rgba(159, 227, 247, 0.16)';
  ctx.lineWidth = 2;
  [150, 230, 310].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(1160, 60, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(70, 240, radius, 0, Math.PI * 2);
    ctx.stroke();
  });

  // The real logo sits on white in the source artwork, so it keeps a white plate here rather than being recoloured.
  const plate = { x: 400, y: 40, w: 480, h: 160 };
  const source = await getSource();
  const logo = { x: 136, y: 12, w: 288, h: 100 };
  // Plate colour is taken from the artwork so no box shows around the cropped logo.
  ctx.drawImage(source, logo.x, logo.y, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  roundRect(ctx, plate.x, plate.y, plate.w, plate.h, 28);
  ctx.fill();
  const scale = Math.min((plate.w - 56) / logo.w, (plate.h - 28) / logo.h);
  const width = logo.w * scale;
  const height = logo.h * scale;
  ctx.drawImage(source, logo.x, logo.y, logo.w, logo.h, plate.x + (plate.w - width) / 2, plate.y + (plate.h - height) / 2, width, height);
  return toPng(canvas);
};

const drawCard = () => {
  const canvas = createCanvas(360, 280);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e8eefb';
  ctx.beginPath();
  ctx.ellipse(170, 165, 150, 105, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(180, 150);
  ctx.rotate(-0.05);
  ctx.translate(-130, -90);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 7;
  roundRect(ctx, 0, 0, 260, 180, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = BLUE;
  roundRect(ctx, 0, 0, 260, 44, [18, 18, 0, 0]);
  ctx.fill();
  ctx.fillStyle = NAVY;
  roundRect(ctx, 106, -34, 48, 62, 9);
  ctx.fill();
  ctx.fillStyle = '#6f9be0';
  roundRect(ctx, 115, -25, 30, 44, 4);
  ctx.fill();

  ctx.fillStyle = '#dbe6f8';
  roundRect(ctx, 22, 62, 86, 96, 10);
  ctx.fill();
  ctx.fillStyle = BLUE;
  ctx.beginPath();
  ctx.arc(65, 94, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(65, 142, 31, 24, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#9db8e6';
  [[126, 74, 110], [126, 100, 96], [126, 126, 70]].forEach(([x, y, w]) => {
    roundRect(ctx, x, y, w, 11, 5);
    ctx.fill();
  });
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(292, 214, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#22a35a';
  ctx.beginPath();
  ctx.arc(292, 214, 39, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(274, 215);
  ctx.lineTo(287, 228);
  ctx.lineTo(311, 201);
  ctx.stroke();

  ctx.strokeStyle = BLUE;
  ctx.lineWidth = 6;
  [[300, 34, 308, 12], [320, 48, 338, 30], [330, 70, 352, 62]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
  return toPng(canvas);
};

let artPromise = null;
const getArt = () => {
  if (!artPromise) {
    artPromise = (async () => {
      const [header, card, ...icons] = await Promise.all([drawHeader(), drawCard(), ...Object.values(ICONS).map(drawIcon)]);
      return { header, card, icons: Object.keys(ICONS).map((name, index) => [name, icons[index]]) };
    })().catch((error) => {
      artPromise = null;
      throw error;
    });
  }
  return artPromise;
};

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const buildDelegateIdEmail = async ({ fullName, email, registrationId, formLink }) => {
  const { header, card, icons } = await getArt();
  const attachments = [
    { filename: 'ghc-id-header.png', content: header, contentType: 'image/png', cid: 'id-header' },
    { filename: 'ghc-id-card.png', content: card, contentType: 'image/png', cid: 'id-card' },
    ...icons.map(([name, content]) => ({ filename: `ghc-id-${name}.png`, content, contentType: 'image/png', cid: `id-icon-${name}` })),
  ];
  const variables = {
    name: escapeHtml(fullName),
    email: escapeHtml(email),
    registrationId: escapeHtml(registrationId),
    formLink: escapeHtml(formLink),
    eventDates: escapeHtml(EVENT.dates),
    venue: escapeHtml(EVENT.venue),
    helpEmails: escapeHtml([EVENT.helpTo, ...EVENT.helpCc].join(', ')),
    helpUrl: escapeHtml(`mailto:${EVENT.helpTo}?subject=${encodeURIComponent('GHC 2026 Photo ID Query')}`),
  };
  return { attachments, variables };
};

module.exports = { buildDelegateIdEmail };
