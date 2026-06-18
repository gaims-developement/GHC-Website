const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const clean = (value) => (value === undefined || value === null || value === '' ? null : value);
const num = (value) => Number(value || 0);
const bool = (value) => value === true || value === 'true' || value === '1' || value === 1;
const code = () => crypto.randomBytes(8).toString('hex').toUpperCase();
const certificateNumber = () => `GHC-CERT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const uploadAsset = async (file) => {
  if (!file) return null;
  if (!(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET)) return `/uploads/certificates/${file.filename}`;
  const result = await uploadToCloudinary(file.path, 'certificates', { resourceType: 'auto' });
  return result.secure_url;
};

const log = async (req, action, certificateId = null, metadata = null) => {
  await ActivityLog.logActivity({ userId: req.user?.id, action, module: 'certificates', recordId: String(certificateId || ''), metadata });
  await pool.query('INSERT INTO certificate_audit_logs (certificate_id, action, user_id, metadata) VALUES (?, ?, ?, ?)', [
    certificateId,
    action,
    req.user?.id || null,
    metadata ? JSON.stringify(metadata) : null,
  ]);
};

const normalize = (row) => row && ({
  id: row.id,
  certificateId: row.certificate_id,
  registrationId: row.registration_id,
  registrationCode: row.registration_code,
  templateId: row.template_id,
  templateName: row.template_name,
  recipientName: row.recipient_name || row.full_name,
  recipientEmail: row.recipient_email || row.email,
  recipientType: row.recipient_type || row.certificate_type,
  certificateType: row.certificate_type || row.recipient_type,
  referenceModule: row.reference_module,
  referenceRecordId: row.reference_record_id,
  issueDate: row.issue_date,
  verificationCode: row.verification_code,
  certificateUrl: row.certificate_url || row.pdf_url,
  pdfUrl: row.pdf_url || row.certificate_url,
  status: row.status || (row.issued ? 'generated' : 'pending'),
  emailStatus: row.email_status,
  issued: row.status !== 'revoked' && Boolean(row.issued),
  createdAt: row.created_at,
});

const certificatePdf = async ({ certificate, template = null }) => {
  const verificationUrl = `/verify-certificate?code=${certificate.verification_code}`;
  const qrBuffer = await QRCode.toBuffer(JSON.stringify({
    certificateId: certificate.certificate_id,
    verificationCode: certificate.verification_code,
    verify: verificationUrl,
  }));

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      layout: template?.orientation === 'portrait' ? 'portrait' : 'landscape',
      margin: 54,
    });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48).lineWidth(2).strokeColor('#0D47A1').stroke();
    doc.fontSize(18).fillColor('#0D47A1').text('GAIMS', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(28).fillColor('#081B33').text(template?.name || 'Global Healthcare Conclave 2026', { align: 'center' });
    doc.moveDown(1.1);
    doc.fontSize(16).fillColor('#475569').text(`${certificate.recipient_type || certificate.certificate_type || 'Certificate'} Certificate`, { align: 'center' });
    doc.moveDown(1.4);
    doc.fontSize(36).fillColor('#081B33').text(certificate.recipient_name || 'Recipient', { align: 'center' });
    doc.moveDown(0.8);
    doc.fontSize(14).fillColor('#334155').text(`Certificate ID: ${certificate.certificate_id}`, { align: 'center' });
    doc.text(`Issued: ${new Date(certificate.issue_date || Date.now()).toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 160, { width: 88 });
    doc.fontSize(9).fillColor('#64748B').text('QR verification', doc.page.width - 156, doc.page.height - 68, { width: 100, align: 'center' });
    doc.end();
  });
};

const dashboard = asyncHandler(async (_req, res) => {
  const [[metrics], [activity]] = await Promise.all([
    pool.query(`
      SELECT COUNT(*) AS totalGenerated,
        SUM(DATE(created_at) = CURDATE()) AS issuedToday,
        SUM(status = 'generated' AND email_status = 'pending') AS pendingCertificates,
        SUM(status = 'revoked') AS revokedCertificates,
        (SELECT COUNT(*) FROM certificate_verifications) AS verificationRequests,
        (SELECT SUM(credit_hours) FROM accreditation_records WHERE credit_type = 'cme') AS cmeCreditsIssued
      FROM certificates
    `),
    pool.query("SELECT * FROM activity_logs WHERE module = 'certificates' ORDER BY timestamp DESC LIMIT 10"),
  ]);
  res.json({ metrics: metrics[0], recentActivity: activity });
});

const listCertificates = asyncHandler(async (req, res) => {
  const params = [];
  const clauses = [];
  if (req.query.status && req.query.status !== 'all') {
    clauses.push('c.status = ?');
    params.push(req.query.status);
  }
  if (req.query.search) {
    clauses.push('(c.certificate_id LIKE ? OR c.recipient_name LIKE ? OR c.recipient_email LIKE ? OR r.registration_id LIKE ?)');
    const term = `%${req.query.search}%`;
    params.push(term, term, term, term);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT c.*, r.registration_id AS registration_code, r.full_name, r.email, t.name AS template_name
     FROM certificates c
     LEFT JOIN registrations r ON r.id = c.registration_id
     LEFT JOIN certificate_templates t ON t.id = c.template_id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT 500`,
    params
  );
  res.json({ certificates: rows.map(normalize) });
});

const generateCertificate = asyncHandler(async (req, res) => {
  const registrationId = req.body.registrationId || req.body.registration_id;
  const templateId = clean(req.body.templateId || req.body.template_id);
  let recipient = {
    name: req.body.recipientName || req.body.recipient_name,
    email: req.body.recipientEmail || req.body.recipient_email,
  };

  if (registrationId) {
    const [[registration]] = await pool.query('SELECT * FROM registrations WHERE id = ? OR registration_id = ? LIMIT 1', [registrationId, registrationId]);
    if (!registration) return res.status(404).json({ message: 'Registration not found' });
    recipient = { name: registration.full_name, email: registration.email, registrationId: registration.id, code: registration.registration_id };
  }

  if (!recipient.name) return res.status(400).json({ message: 'Recipient name is required' });

  const [[template]] = templateId
    ? await pool.query('SELECT * FROM certificate_templates WHERE id = ? LIMIT 1', [templateId])
    : await pool.query('SELECT * FROM certificate_templates WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1');

  const certificateId = certificateNumber();
  const verificationCode = code();
  const recipientType = req.body.recipientType || req.body.recipient_type || template?.category || req.body.certificateType || req.body.certificate_type || 'general';
  const [result] = await pool.query(
    `INSERT INTO certificates
     (certificate_id, registration_id, certificate_type, template_id, recipient_name, recipient_email, recipient_type,
      reference_module, reference_record_id, issue_date, verification_code, certificate_url, pdf_url, status, email_status, issued)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated', 'pending', TRUE)`,
    [
      certificateId,
      recipient.registrationId || null,
      recipientType,
      template?.id || null,
      recipient.name,
      recipient.email || null,
      recipientType,
      clean(req.body.referenceModule || req.body.reference_module),
      clean(req.body.referenceRecordId || req.body.reference_record_id || recipient.code),
      req.body.issueDate || req.body.issue_date || new Date(),
      verificationCode,
      `/api/certificates/${certificateId}/pdf`,
      `/api/certificates/${certificateId}/pdf`,
    ]
  );
  await log(req, 'generated_certificate', result.insertId, { recipientType });
  const [[certificate]] = await pool.query('SELECT * FROM certificates WHERE id = ? LIMIT 1', [result.insertId]);
  res.status(201).json({ certificate: normalize(certificate) });
});

const bulkGenerate = asyncHandler(async (req, res) => {
  const recipients = Array.isArray(req.body.recipients) ? req.body.recipients : [];
  if (!recipients.length) return res.status(400).json({ message: 'recipients array is required' });
  const generated = [];
  for (const recipient of recipients) {
    const [result] = await pool.query(
      `INSERT INTO certificates (certificate_id, template_id, recipient_name, recipient_email, recipient_type, reference_module, reference_record_id, issue_date, verification_code, certificate_url, pdf_url, status, email_status, issued)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'generated', 'pending', TRUE)`,
      [
        certificateNumber(),
        clean(recipient.templateId || req.body.templateId),
        recipient.name,
        clean(recipient.email),
        recipient.recipientType || req.body.recipientType || 'general',
        clean(recipient.referenceModule),
        clean(recipient.referenceRecordId),
        req.body.issueDate || new Date(),
        code(),
        '',
        '',
      ]
    );
    await pool.query('UPDATE certificates SET certificate_url = ?, pdf_url = ? WHERE id = ?', [`/api/certificates/${result.insertId}/pdf`, `/api/certificates/${result.insertId}/pdf`, result.insertId]);
    generated.push(result.insertId);
  }
  await log(req, 'bulk_generated_certificates', null, { count: generated.length });
  res.status(201).json({ generated });
});

const revokeCertificate = asyncHandler(async (req, res) => {
  await pool.query("UPDATE certificates SET status = 'revoked', issued = FALSE WHERE id = ? OR certificate_id = ?", [req.params.id, req.params.id]);
  const [[certificate]] = await pool.query('SELECT id FROM certificates WHERE id = ? OR certificate_id = ? LIMIT 1', [req.params.id, req.params.id]);
  await log(req, 'revoked_certificate', certificate?.id || req.params.id);
  res.json({ success: true });
});

const resendCertificate = asyncHandler(async (req, res) => {
  await pool.query("UPDATE certificates SET email_status = 'sent', status = IF(status = 'revoked', status, 'sent') WHERE id = ? OR certificate_id = ?", [req.params.id, req.params.id]);
  const [[certificate]] = await pool.query('SELECT id FROM certificates WHERE id = ? OR certificate_id = ? LIMIT 1', [req.params.id, req.params.id]);
  await log(req, 'resent_certificate_email', certificate?.id || req.params.id);
  res.json({ success: true });
});

const downloadCertificate = asyncHandler(async (req, res) => {
  const [[certificate]] = await pool.query('SELECT c.*, t.name AS template_name, t.orientation FROM certificates c LEFT JOIN certificate_templates t ON t.id = c.template_id WHERE c.id = ? OR c.certificate_id = ? LIMIT 1', [req.params.id, req.params.id]);
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
  const buffer = await certificatePdf({ certificate, template: { name: certificate.template_name, orientation: certificate.orientation } });
  await log(req, 'downloaded_certificate', certificate.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${certificate.certificate_id || certificate.id}.pdf"`);
  res.send(buffer);
});

const verifyCertificate = asyncHandler(async (req, res) => {
  const id = req.query.id || req.query.code || req.params.code;
  const [[certificate]] = await pool.query(
    'SELECT * FROM certificates WHERE certificate_id = ? OR verification_code = ? LIMIT 1',
    [id, id]
  );
  if (!certificate) return res.status(404).json({ valid: false, message: 'Certificate not found' });
  await pool.query('INSERT INTO certificate_verifications (certificate_id, ip_address) VALUES (?, ?)', [certificate.id, req.ip]);
  res.json({ valid: certificate.status !== 'revoked', certificate: normalize(certificate) });
});

const listTemplates = asyncHandler(async (_req, res) => {
  const [templates] = await pool.query('SELECT * FROM certificate_templates ORDER BY created_at DESC');
  res.json({ templates });
});

const saveTemplate = asyncHandler(async (req, res) => {
  const background = await uploadAsset(req.file);
  const values = [
    req.body.name,
    clean(req.body.category),
    background || clean(req.body.backgroundImage || req.body.background_image),
    req.body.orientation || 'landscape',
    JSON.stringify(req.body.templateData || req.body.template_data || {}),
    req.body.isActive === undefined ? true : bool(req.body.isActive),
  ];
  if (!values[0]) return res.status(400).json({ message: 'Template name is required' });
  let id = req.params.id;
  if (id) {
    await pool.query('UPDATE certificate_templates SET name = ?, category = ?, background_image = COALESCE(?, background_image), orientation = ?, template_data = ?, is_active = ? WHERE id = ?', [...values, id]);
  } else {
    const [result] = await pool.query('INSERT INTO certificate_templates (name, category, background_image, orientation, template_data, is_active) VALUES (?, ?, ?, ?, ?, ?)', values);
    id = result.insertId;
  }
  await log(req, req.params.id ? 'updated_certificate_template' : 'created_certificate_template', null, { templateId: id });
  return listTemplates(req, res);
});

const duplicateTemplate = asyncHandler(async (req, res) => {
  const [[template]] = await pool.query('SELECT * FROM certificate_templates WHERE id = ? LIMIT 1', [req.params.id]);
  if (!template) return res.status(404).json({ message: 'Template not found' });
  const [result] = await pool.query('INSERT INTO certificate_templates (name, category, background_image, orientation, template_data, is_active) VALUES (?, ?, ?, ?, ?, FALSE)', [`Copy of ${template.name}`, template.category, template.background_image, template.orientation, template.template_data]);
  await log(req, 'duplicated_certificate_template', null, { templateId: result.insertId, sourceTemplateId: req.params.id });
  return listTemplates(req, res);
});

const saveField = asyncHandler(async (req, res) => {
  const values = [req.body.templateId, req.body.fieldName, req.body.fieldType || 'text', num(req.body.xPosition), num(req.body.yPosition), num(req.body.fontSize || 18), clean(req.body.fontFamily), req.body.alignment || 'center'];
  const [result] = await pool.query('INSERT INTO certificate_fields (template_id, field_name, field_type, x_position, y_position, font_size, font_family, alignment) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', values);
  await log(req, 'saved_certificate_field', null, { fieldId: result.insertId });
  res.status(201).json({ id: result.insertId });
});

const listSignatures = asyncHandler(async (_req, res) => {
  const [signatures] = await pool.query('SELECT * FROM digital_signatures ORDER BY created_at DESC');
  res.json({ signatures });
});

const saveSignature = asyncHandler(async (req, res) => {
  const image = await uploadAsset(req.file);
  const values = [req.body.name, clean(req.body.designation), image || clean(req.body.signatureImage || req.body.signature_image), req.body.isActive === undefined ? true : bool(req.body.isActive)];
  if (req.params.id) await pool.query('UPDATE digital_signatures SET name = ?, designation = ?, signature_image = COALESCE(?, signature_image), is_active = ? WHERE id = ?', [...values, req.params.id]);
  else await pool.query('INSERT INTO digital_signatures (name, designation, signature_image, is_active) VALUES (?, ?, ?, ?)', values);
  await log(req, req.params.id ? 'updated_signature' : 'created_signature');
  return listSignatures(req, res);
});

const listAccreditation = asyncHandler(async (_req, res) => {
  const [records] = await pool.query('SELECT * FROM accreditation_records ORDER BY created_at DESC');
  res.json({ records });
});

const saveAccreditation = asyncHandler(async (req, res) => {
  const values = [clean(req.body.participantId || req.body.participant_id), clean(req.body.participantName || req.body.participant_name), clean(req.body.participantEmail || req.body.participant_email), req.body.creditType || req.body.credit_type || 'cme', num(req.body.creditHours || req.body.credit_hours), req.user?.id || null, new Date()];
  const [result] = await pool.query('INSERT INTO accreditation_records (participant_id, participant_name, participant_email, credit_type, credit_hours, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?)', values);
  await log(req, 'saved_accreditation_record', null, { accreditationId: result.insertId });
  res.status(201).json({ id: result.insertId });
});

const reports = asyncHandler(async (_req, res) => {
  const [[byCategory], [byDepartment], [verifications], [downloads], [email], [credits]] = await Promise.all([
    pool.query('SELECT COALESCE(recipient_type, certificate_type, "general") AS label, COUNT(*) AS total FROM certificates GROUP BY label'),
    pool.query('SELECT COALESCE(reference_module, "manual") AS label, COUNT(*) AS total FROM certificates GROUP BY label'),
    pool.query('SELECT DATE(verified_at) AS label, COUNT(*) AS total FROM certificate_verifications GROUP BY label ORDER BY label'),
    pool.query("SELECT DATE(created_at) AS label, COUNT(*) AS total FROM certificate_audit_logs WHERE action = 'downloaded_certificate' GROUP BY label ORDER BY label"),
    pool.query('SELECT email_status AS label, COUNT(*) AS total FROM certificates GROUP BY email_status'),
    pool.query('SELECT credit_type AS label, SUM(credit_hours) AS total FROM accreditation_records GROUP BY credit_type'),
  ]);
  res.json({ byCategory, byDepartment, verifications, downloads, email, credits });
});

module.exports = {
  bulkGenerate,
  dashboard,
  downloadCertificate,
  duplicateTemplate,
  generateCertificate,
  listAccreditation,
  listCertificates,
  listSignatures,
  listTemplates,
  reports,
  resendCertificate,
  revokeCertificate,
  saveAccreditation,
  saveField,
  saveSignature,
  saveTemplate,
  verifyCertificate,
};
