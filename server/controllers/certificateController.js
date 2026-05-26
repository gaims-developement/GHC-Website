const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');

const normalize = (row) => row && ({
  id: row.id,
  registrationId: row.registration_id,
  registrationCode: row.registration_code,
  fullName: row.full_name,
  email: row.email,
  certificateType: row.certificate_type,
  pdfUrl: row.pdf_url,
  issued: Boolean(row.issued),
  createdAt: row.created_at,
});

const certificatePdf = async ({ certificate, registration }) => {
  const qrBuffer = await QRCode.toBuffer(JSON.stringify({
    certificateId: certificate.id,
    registrationId: registration.registration_id,
    type: certificate.certificate_type,
  }));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 54 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(24, 24, 794, 547).lineWidth(2).strokeColor('#0D47A1').stroke();
    doc.fontSize(18).fillColor('#0D47A1').text('GAIMS', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(28).fillColor('#081B33').text('Global Healthcare Conclave 2026', { align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(16).fillColor('#475569').text('Certificate of Recognition', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(36).fillColor('#081B33').text(registration.full_name || 'Delegate', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(15).fillColor('#334155').text(`${certificate.certificate_type} Certificate`, { align: 'center' });
    doc.moveDown(0.5);
    doc.text('Event: Global Healthcare Conclave 2026', { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.image(qrBuffer, 685, 392, { width: 88 });
    doc.fontSize(9).fillColor('#64748B').text('QR verification', 680, 484, { width: 100, align: 'center' });
    doc.fontSize(11).fillColor('#081B33').text('GAIMS Branding', 64, 478);
    doc.end();
  });
};

const listCertificates = asyncHandler(async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.issued === 'true' || req.query.issued === 'false') {
    where = 'WHERE c.issued = ?';
    params.push(req.query.issued === 'true');
  }

  const [rows] = await pool.query(
    `SELECT c.*, r.registration_id AS registration_code, r.full_name, r.email
     FROM certificates c
     LEFT JOIN registrations r ON r.id = c.registration_id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT 100`,
    params
  );
  res.json({ certificates: rows.map(normalize) });
});

const generateCertificate = asyncHandler(async (req, res) => {
  const registrationId = req.body.registrationId || req.body.registration_id;
  const certificateType = req.body.certificateType || req.body.certificate_type || 'Delegate';
  if (!registrationId) return res.status(400).json({ message: 'Registration is required' });

  const [[registration]] = await pool.query(
    'SELECT * FROM registrations WHERE id = ? OR registration_id = ? LIMIT 1',
    [registrationId, registrationId]
  );
  if (!registration) return res.status(404).json({ message: 'Registration not found' });

  const [result] = await pool.query(
    `INSERT INTO certificates (registration_id, certificate_type, issued)
     VALUES (?, ?, TRUE)`,
    [registration.id, certificateType]
  );
  const pdfUrl = `/api/certificates/${result.insertId}/pdf`;
  await pool.query('UPDATE certificates SET pdf_url = ? WHERE id = ?', [pdfUrl, result.insertId]);
  await pool.query(
    `INSERT INTO analytics_events (event_type, user_id, registration_id, metadata)
     VALUES ('certificate_generated', ?, ?, ?)`,
    [req.user?.id || null, registration.id, JSON.stringify({ certificateType })]
  );

  const [[certificate]] = await pool.query(
    `SELECT c.*, r.registration_id AS registration_code, r.full_name, r.email
     FROM certificates c LEFT JOIN registrations r ON r.id = c.registration_id
     WHERE c.id = ? LIMIT 1`,
    [result.insertId]
  );

  res.status(201).json({ certificate: normalize(certificate) });
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const [[certificate]] = await pool.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [req.params.id]);
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
  const [[registration]] = await pool.query('SELECT * FROM registrations WHERE id = ? LIMIT 1', [certificate.registration_id]);
  const buffer = await certificatePdf({ certificate, registration });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="ghc-certificate-${certificate.id}.pdf"`);
  res.send(buffer);
});

module.exports = { downloadCertificate, generateCertificate, listCertificates };
