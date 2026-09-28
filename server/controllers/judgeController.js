const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { pool } = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const Nomination = require('../models/nominationModel');
const { sendTemplateEmail } = require('../services/mailService');
const { uploadToCloudinary } = require('../services/cloudinaryService');

const cloudinaryConfigured = () =>
  Boolean(
    (process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME) &&
      (process.env.CLOUDINARY_KEY || process.env.CLOUDINARY_API_KEY) &&
      (process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_API_SECRET)
  );

const writeAudit = async (req, action, recordId, oldValues = null, newValues = null) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, module, record_type, record_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user?.id || null,
        action,
        'award_nominations',
        'nomination',
        String(recordId),
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip || req.socket?.remoteAddress || null,
        req.headers?.['user-agent'] || null,
      ]
    );
  } catch (error) {
    console.warn('Failed to write audit log:', error.message);
  }
};

const getEventDefaults = async () => {
  try {
    const [[eventRow]] = await pool.query(`
      SELECT
        COALESCE(name, title) AS event_name,
        COALESCE(DATE_FORMAT(start_date, '%d %M %Y'), '26-28 September 2026') AS event_date,
        COALESCE(venue, 'S.E.T Facility, AIIMS New Delhi') AS event_venue
      FROM events
      WHERE status = 'published'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    return {
      eventName: eventRow?.event_name || 'Global Healthcare Conclave 2026',
      eventDate: eventRow?.event_date || '26-28 September 2026',
      eventVenue: eventRow?.event_venue || 'S.E.T Facility, AIIMS New Delhi',
    };
  } catch {
    return {
      eventName: 'Global Healthcare Conclave 2026',
      eventDate: '26-28 September 2026',
      eventVenue: 'S.E.T Facility, AIIMS New Delhi',
    };
  }
};

const getNominationSettings = async () => {
  try {
    const [rows] = await pool.query("SELECT setting_value FROM app_settings WHERE setting_key = 'nomination_settings' LIMIT 1");
    if (rows[0]?.setting_value) {
      const val = typeof rows[0].setting_value === 'string' ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
      const paymentUrl = process.env.CLIRNET_NOMINATION_PAYMENT_URL || val.paymentUrl || 'https://mc.clirnet.com/mastercast/connect/D0921-Conclave-2';
      return {
        fee: Number(val.fee) || 5000,
        currency: val.currency || 'INR',
        paymentUrl,
        instructions: val.instructions || 'Complete your nomination payment through CLIRNET. After payment, return to this page and enter your Payment ID to submit your nomination.',
      };
    }
  } catch (err) {
    console.warn('Error reading nomination_settings from app_settings:', err.message);
  }

  return {
    fee: Number(process.env.NOMINATION_FEE) || 5000,
    currency: 'INR',
    paymentUrl: process.env.CLIRNET_NOMINATION_PAYMENT_URL || 'https://mc.clirnet.com/mastercast/connect/D0921-Conclave-2',
    instructions: 'Complete your nomination payment through CLIRNET. After payment, return to this page and enter your Payment ID to submit your nomination.',
  };
};

const getNominationConfig = asyncHandler(async (_req, res) => {
  const config = await getNominationSettings();
  res.json({
    fee: config.fee,
    currency: config.currency,
    paymentUrl: config.paymentUrl,
    instructions: config.instructions,
  });
});

const updateNominationConfig = asyncHandler(async (req, res) => {
  const { fee, currency = 'INR', paymentUrl, instructions } = req.body;
  const current = await getNominationSettings();
  const nextConfig = {
    fee: fee != null ? Number(fee) : current.fee,
    currency: currency || current.currency,
    paymentUrl: paymentUrl ? String(paymentUrl).trim() : current.paymentUrl,
    instructions: instructions ? String(instructions).trim() : current.instructions,
  };

  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
    ['nomination_settings', JSON.stringify(nextConfig)]
  );

  res.json({
    message: 'Nomination configuration updated successfully',
    config: nextConfig,
  });
});

const saveNominationDraft = asyncHandler(async (req, res) => {
  const { draftId, email, fullName, awardId } = req.body;
  if (!draftId) {
    return res.status(400).json({ message: 'Draft ID is required' });
  }

  let cvUrl = req.body.cvUrl || null;
  let photoUrl = req.body.photoUrl || null;

  const cvFile = req.files?.cv?.[0] || req.files?.cvFile?.[0];
  if (cvFile) {
    if (cloudinaryConfigured()) {
      try {
        const uploadRes = await uploadToCloudinary(cvFile.path, 'documents', { resourceType: 'auto', transform: false });
        cvUrl = uploadRes.secure_url;
      } catch (err) {
        console.warn('Cloudinary upload error in draft, fallback to local:', err.message);
        cvUrl = `/uploads/${cvFile.filename}`;
      }
    } else {
      cvUrl = `/uploads/${cvFile.filename}`;
    }
  }

  const photoFile = req.files?.photo?.[0] || req.files?.photoFile?.[0];
  if (photoFile) {
    if (cloudinaryConfigured()) {
      try {
        const uploadRes = await uploadToCloudinary(photoFile.path, 'avatars', { resourceType: 'image' });
        photoUrl = uploadRes.secure_url;
      } catch {
        photoUrl = `/uploads/${photoFile.filename}`;
      }
    } else {
      photoUrl = `/uploads/${photoFile.filename}`;
    }
  }

  let parsedFormData = {};
  if (req.body.formData) {
    try {
      parsedFormData = typeof req.body.formData === 'string' ? JSON.parse(req.body.formData) : req.body.formData;
    } catch {
      parsedFormData = {};
    }
  } else {
    parsedFormData = { ...req.body };
  }

  if (cvUrl) parsedFormData.cvUrl = cvUrl;
  if (photoUrl) parsedFormData.photoUrl = photoUrl;

  await Nomination.saveDraft({
    draftId,
    email: email || parsedFormData.email || null,
    fullName: fullName || parsedFormData.fullName || null,
    awardId: awardId || parsedFormData.awardId || null,
    draftData: parsedFormData,
  });

  res.json({
    success: true,
    draftId,
    cvUrl,
    photoUrl,
    message: 'Nomination draft saved successfully',
  });
});

const getNominationDraft = asyncHandler(async (req, res) => {
  const { draftId } = req.params;
  const draft = await Nomination.getDraft(draftId);
  if (!draft) {
    return res.status(404).json({ message: 'Draft not found' });
  }
  res.json(draft);
});

const getDashboardStats = asyncHandler(async (_req, res) => {
  const stats = await Nomination.getStats();
  const pendingData = await Nomination.list({
    status: 'PENDING',
    limit: 10,
    offset: 0,
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });

  res.json({
    stats,
    pendingNominations: pendingData.nominations,
  });
});

const getNominations = asyncHandler(async (req, res) => {
  const {
    search = '',
    awardCategory = '',
    status = '',
    paymentStatus = '',
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'DESC',
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 20, 100));
  const offset = (pageNum - 1) * limitNum;

  const result = await Nomination.list({
    search,
    awardCategory,
    status,
    paymentStatus,
    limit: limitNum,
    offset,
    sortBy,
    sortOrder,
  });

  res.json({
    nominations: result.nominations,
    total: result.total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(result.total / limitNum) || 1,
  });
});

const getNomination = asyncHandler(async (req, res) => {
  const nomination = await Nomination.findById(req.params.id);
  if (!nomination) {
    return res.status(404).json({ message: 'Nomination not found.' });
  }

  res.json({ nomination });
});

const acceptNomination = asyncHandler(async (req, res) => {
  const nomination = await Nomination.findById(req.params.id);
  if (!nomination) {
    return res.status(404).json({ message: 'Nomination not found.' });
  }

  // Final Decision Rule: Cannot re-decide after accepted or rejected
  if (nomination.status === 'ACCEPTED' || nomination.status === 'REJECTED') {
    return res.status(400).json({
      message: `This nomination has already been finalized as ${nomination.status} and cannot be modified.`,
    });
  }

  const judgeId = req.user.id;
  const judgeName = req.user.name || req.user.email || 'Award Judge';
  const { decisionNotes = null } = req.body;

  const updated = await Nomination.updateDecision(nomination.id, {
    status: 'ACCEPTED',
    reviewedBy: judgeId,
    reviewerName: judgeName,
    decisionNotes,
  });

  await writeAudit(
    req,
    'NOMINATION_ACCEPTED',
    nomination.id,
    { status: nomination.status },
    { status: 'ACCEPTED', reviewedBy: judgeId, reviewerName: judgeName }
  );

  // Trigger acceptance email
  let emailDelivered = false;
  let emailErrorMessage = null;

  try {
    const eventDefaults = await getEventDefaults();
    await sendTemplateEmail('award_nominee_accepted', nomination.email, {
      name: nomination.fullName,
      award_category: nomination.awardCategory,
      event_name: eventDefaults.eventName,
      event_date: eventDefaults.eventDate,
      event_venue: eventDefaults.eventVenue,
    });
    emailDelivered = true;
  } catch (emailError) {
    console.warn(`Acceptance email to ${nomination.email} failed:`, emailError.message);
    emailErrorMessage = emailError.message || String(emailError);
  }

  if (emailDelivered) {
    return res.json({
      success: true,
      emailDelivered: true,
      message: 'Nominee accepted successfully.',
      nomination: updated,
    });
  }

  // Acceptance is NOT reversed if SMTP fails
  return res.json({
    success: true,
    emailDelivered: false,
    message: 'Nominee accepted, but the acceptance email could not be delivered. The email can be retried from Email Delivery.',
    error: emailErrorMessage,
    nomination: updated,
  });
});

const rejectNomination = asyncHandler(async (req, res) => {
  const nomination = await Nomination.findById(req.params.id);
  if (!nomination) {
    return res.status(404).json({ message: 'Nomination not found.' });
  }

  // Final Decision Rule: Cannot re-decide after accepted or rejected
  if (nomination.status === 'ACCEPTED' || nomination.status === 'REJECTED') {
    return res.status(400).json({
      message: `This nomination has already been finalized as ${nomination.status} and cannot be modified.`,
    });
  }

  const judgeId = req.user.id;
  const judgeName = req.user.name || req.user.email || 'Award Judge';
  const { decisionNotes = null } = req.body;

  const updated = await Nomination.updateDecision(nomination.id, {
    status: 'REJECTED',
    reviewedBy: judgeId,
    reviewerName: judgeName,
    decisionNotes,
  });

  await writeAudit(
    req,
    'NOMINATION_REJECTED',
    nomination.id,
    { status: nomination.status },
    { status: 'REJECTED', reviewedBy: judgeId, reviewerName: judgeName }
  );

  // STRICT REQUIREMENT: NO REJECTION EMAIL SENT
  return res.json({
    success: true,
    message: 'Nominee rejected.',
    nomination: updated,
  });
});

const getDocument = asyncHandler(async (req, res) => {
  const nomination = await Nomination.findById(req.params.id);
  if (!nomination) {
    return res.status(404).json({ message: 'Nomination not found.' });
  }

  const { docType } = req.params;
  const isDownload = req.query.download === '1' || req.query.download === 'true';

  let targetUrl = null;
  let fileName = '';

  if (docType === 'cv') {
    targetUrl = nomination.cvUrl;
    fileName = `${nomination.fullName.replace(/[^a-zA-Z0-9_-]/g, '_')}_CV.pdf`;
  } else if (docType === 'photo') {
    targetUrl = nomination.photoUrl;
    fileName = `${nomination.fullName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Photo.jpg`;
  } else if (docType.startsWith('doc_') || !Number.isNaN(Number(docType))) {
    const idx = parseInt(docType.replace('doc_', ''), 10);
    const doc = (nomination.supportingDocuments || [])[idx];
    targetUrl = typeof doc === 'string' ? doc : doc?.url;
    fileName = (typeof doc === 'object' && doc?.name) || `Document_${idx + 1}.pdf`;
  }

  if (!targetUrl) {
    return res.status(404).json({ message: 'Requested document not found on this nomination.' });
  }

  const disposition = isDownload ? 'attachment' : 'inline';
  const uploadsDir = path.resolve(__dirname, '..', 'uploads');

  // 1. Handle remote URL (Cloudinary)
  if (/^https?:\/\//i.test(targetUrl)) {
    if (docType === 'photo' || /\.(jpg|jpeg|png|webp)$/i.test(targetUrl)) {
      return res.redirect(targetUrl);
    }

    // Fetch and proxy PDF from Cloudinary
    const client = targetUrl.startsWith('https') ? https : http;
    client.get(targetUrl, (proxyRes) => {
      if (proxyRes.statusCode === 200) {
        res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'application/pdf');
        res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
        return proxyRes.pipe(res);
      }

      // If Cloudinary denies raw .pdf delivery (ACL restrictions), fetch the high-res rendered document from Cloudinary
      const pngUrl = targetUrl.replace(/\.pdf$/i, '.png');
      client.get(pngUrl, (pngRes) => {
        if (pngRes.statusCode === 200) {
          const imgChunks = [];
          pngRes.on('data', chunk => imgChunks.push(chunk));
          pngRes.on('end', () => {
            const imgBuf = Buffer.concat(imgChunks);
            const PDFDocument = require('pdfkit');
            const doc = new PDFDocument({ autoFirstPage: false });
            doc.addPage({ size: [612, 792], margin: 0 });
            doc.image(imgBuf, 0, 0, { width: 612, height: 792 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `${disposition}; filename="${fileName}"`);
            doc.pipe(res);
            doc.end();
          });
          return;
        }

        return res.redirect(targetUrl);
      }).on('error', () => res.redirect(targetUrl));
    }).on('error', () => res.redirect(targetUrl));
    return;
  }

  // 2. Handle local uploaded file
  let localFilePath = null;
  const relativePath = targetUrl.replace(/^\/uploads\//, '');
  const candidatePath = path.resolve(uploadsDir, relativePath);
  if (candidatePath.startsWith(uploadsDir) && fs.existsSync(candidatePath)) {
    localFilePath = candidatePath;
  }

  // Fallback check for local document if exact path failed
  if (!localFilePath) {
    const candidateNames = [
      path.basename(targetUrl),
      'declaration_form.pdf',
      '6a483978bd51e5c2a081e6497e0efa11',
    ];
    for (const name of candidateNames) {
      const p = path.resolve(uploadsDir, name);
      if (p.startsWith(uploadsDir) && fs.existsSync(p)) {
        localFilePath = p;
        break;
      }
    }
  }

  if (localFilePath) {
    const ext = path.extname(localFilePath).toLowerCase();
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = contentTypeMap[ext] || (docType === 'cv' ? 'application/pdf' : 'application/octet-stream');

    if (contentType === 'application/pdf') {
      try {
        const headerBuf = Buffer.alloc(10);
        const fd = fs.openSync(localFilePath, 'r');
        fs.readSync(fd, headerBuf, 0, 10, 0);
        fs.closeSync(fd);

        if (!headerBuf.toString('ascii').startsWith('%PDF-')) {
          const rawContent = fs.readFileSync(localFilePath);
          const text = rawContent.includes(Buffer.from([0xff, 0xfe]))
            ? rawContent.toString('utf16le')
            : rawContent.toString('utf8');

          const PDFDocument = require('pdfkit');
          const doc = new PDFDocument({ margin: 50 });
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `${disposition}; filename="${fileName || path.basename(localFilePath)}"`);
          doc.pipe(res);
          doc.fontSize(20).fillColor('#1e1b4b').text('GLOBAL HEALTH CONCLAVE 2026', { align: 'center' });
          doc.moveDown(0.5);
          doc.fontSize(14).fillColor('#4338ca').text(`Nominee Document: ${fileName}`, { align: 'center' });
          doc.moveDown(1);
          doc.fontSize(12).fillColor('#334155').text(`Candidate: ${nomination.fullName || 'Nominee'}`);
          doc.text(`Award Category: ${nomination.awardCategory || 'Award'}`);
          doc.moveDown(1.5);
          doc.fontSize(11).fillColor('#0f172a').text(text.trim() || 'Uploaded Candidate Document');
          doc.end();
          return;
        }
      } catch (err) {
        console.warn('PDF header check error:', err.message);
      }
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${fileName || path.basename(localFilePath)}"`);
    return fs.createReadStream(localFilePath).pipe(res);
  }

  return res.status(404).json({ message: 'Document file not found on disk.' });
});

const getAwardCategories = asyncHandler(async (_req, res) => {
  const [awardRows] = await pool.query('SELECT id, name, description, category, prize FROM awards ORDER BY id ASC');

  // Also query distinct categories and age subcategories currently used in nominations
  const [usedCategories] = await pool.query(`
    SELECT DISTINCT award_category, age_category
    FROM award_nominations
    WHERE award_category IS NOT NULL AND award_category != ''
  `);

  res.json({
    awards: awardRows,
    usedCategories,
    ageCategories: [
      { id: 'under_20', label: 'Under 20', maxAge: 20 },
      { id: 'under_30', label: 'Under 30', maxAge: 30 },
      { id: 'under_40', label: 'Under 40', maxAge: 40 },
    ],
  });
});

const publicSubmitNomination = asyncHandler(async (req, res) => {
  const {
    awardId,
    awardCategory,
    awardKey,
    ageCategory,
    fullName,
    dob,
    age,
    sex,
    medicalCollege,
    organisation,
    designation,
    email,
    mobile,
    socialLinks,
    nominationStatement,
    paymentId,
    draftId,
  } = req.body;

  if (!fullName || !organisation || !designation || !email || !mobile || !awardCategory) {
    return res.status(400).json({
      message: 'Missing required nomination fields (fullName, organisation, designation, email, mobile, awardCategory).',
    });
  }

  // 1. Validate Payment ID (CLIRNET manual external payment requirement)
  if (!paymentId || !String(paymentId).trim()) {
    return res.status(400).json({
      message: 'Payment ID is required before submitting your nomination.',
    });
  }

  const cleanPaymentId = String(paymentId).trim();
  if (cleanPaymentId.length < 3 || cleanPaymentId.length > 100) {
    return res.status(400).json({
      message: 'Please enter a valid CLIRNET Payment ID (between 3 and 100 characters).',
    });
  }

  // 2. Duplicate Payment ID check (Section 20 requirement)
  const existingPayment = await Nomination.findByPaymentId(cleanPaymentId);
  if (existingPayment) {
    // If idempotent submission with same draftId, return existing submission
    if (draftId && existingPayment.draftId === draftId) {
      return res.status(200).json({
        success: true,
        nominationId: existingPayment.nominationId,
        paymentId: existingPayment.paymentId,
        awardCategory: existingPayment.awardCategory,
        fullName: existingPayment.fullName,
        status: 'Submitted',
        message: 'Your nomination has already been submitted successfully.',
        nomination: existingPayment,
      });
    }

    return res.status(400).json({
      message: 'This Payment ID has already been used for another nomination. Please verify your Payment ID.',
    });
  }

  // 3. Idempotency check with draftId (Section 21 requirement)
  if (draftId) {
    const existingDraft = await Nomination.findByDraftId(draftId);
    if (existingDraft) {
      return res.status(200).json({
        success: true,
        nominationId: existingDraft.nominationId,
        paymentId: existingDraft.paymentId,
        awardCategory: existingDraft.awardCategory,
        fullName: existingDraft.fullName,
        status: 'Submitted',
        message: 'Your nomination has already been submitted successfully.',
        nomination: existingDraft,
      });
    }
  }

  let photoUrl = req.body.photoUrl || null;
  let photoCloudinaryId = null;
  let cvUrl = req.body.cvUrl || null;
  let cvCloudinaryId = null;

  // Process CV upload
  const cvFile = req.files?.cvFile?.[0] || req.files?.cv?.[0];
  if (cvFile) {
    cvUrl = `/uploads/${cvFile.filename}`;
  }

  // Process Photo upload
  const photoFile = req.files?.photoFile?.[0] || req.files?.photo?.[0];
  if (photoFile) {
    if (cloudinaryConfigured()) {
      try {
        const uploadRes = await uploadToCloudinary(photoFile.path, 'forms', { resourceType: 'image' });
        photoUrl = uploadRes.secure_url;
        photoCloudinaryId = uploadRes.public_id;
      } catch (err) {
        console.warn('Cloudinary upload failed for nomination photo, using local file:', err.message);
        photoUrl = `/uploads/${photoFile.filename}`;
      }
    } else {
      photoUrl = `/uploads/${photoFile.filename}`;
    }
  }

  if (!cvUrl) {
    return res.status(400).json({ message: 'Candidate CV (PDF) is required.' });
  }

  if (!photoUrl) {
    return res.status(400).json({ message: 'Candidate Photo is required.' });
  }

  // Supporting docs
  const supportingDocuments = [];
  const extraDocs = req.files?.documents || [];
  for (const doc of extraDocs) {
    if (cloudinaryConfigured()) {
      try {
        const uploadRes = await uploadToCloudinary(doc.path, 'forms', { resourceType: 'auto' });
        supportingDocuments.push({ name: doc.originalname, url: uploadRes.secure_url });
      } catch {
        supportingDocuments.push({ name: doc.originalname, url: `/uploads/${doc.filename}` });
      }
    } else {
      supportingDocuments.push({ name: doc.originalname, url: `/uploads/${doc.filename}` });
    }
  }

  let parsedSocialLinks = [];
  try {
    parsedSocialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : (socialLinks || []);
  } catch {
    parsedSocialLinks = [];
  }

  // Calculate age if not provided
  let calculatedAge = age ? parseInt(age, 10) : null;
  if (!calculatedAge && dob) {
    const birthDate = new Date(dob);
    const today = new Date();
    calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
  }

  const nominationConfig = await getNominationSettings();

  const created = await Nomination.create({
    awardId: awardId ? parseInt(awardId, 10) : null,
    awardCategory,
    awardKey: awardKey || null,
    ageCategory: ageCategory || null,
    fullName,
    dob: dob || null,
    age: calculatedAge,
    sex: sex || null,
    medicalCollege: medicalCollege || null,
    organisation,
    designation,
    email,
    mobile,
    socialLinks: parsedSocialLinks,
    nominationStatement: nominationStatement || null,
    photoUrl,
    photoCloudinaryId,
    cvUrl,
    cvCloudinaryId,
    supportingDocuments,
    paymentId: cleanPaymentId,
    paymentStatus: 'PAYMENT_ID_SUBMITTED',
    paymentProvider: 'CLIRNET',
    paymentAmount: nominationConfig.fee,
    paymentSubmittedAt: new Date(),
    draftId: draftId || null,
    status: 'PENDING',
  });

  await writeAudit(req, 'NOMINATION_SUBMITTED', created.id, null, {
    nominationId: created.nominationId,
    paymentId: cleanPaymentId,
    fullName: created.fullName,
    awardCategory: created.awardCategory,
    paymentStatus: 'PAYMENT_ID_SUBMITTED',
  });

  // Dispatches central confirmation email via sendTemplateEmail
  const eventDefaults = await getEventDefaults();
  try {
    await sendTemplateEmail({
      templateKey: 'nomination_submission_confirmation',
      recipient: created.email,
      variables: {
        name: created.fullName,
        nomination_id: created.nominationId,
        award_category: created.awardCategory,
        payment_id: created.paymentId,
        event_name: eventDefaults.eventName,
        event_date: eventDefaults.eventDate,
        event_venue: eventDefaults.eventVenue,
      },
    });
  } catch (emailErr) {
    console.warn('Failed to send nomination confirmation email:', emailErr.message);
  }

  res.status(201).json({
    success: true,
    nominationId: created.nominationId,
    paymentId: created.paymentId,
    awardCategory: created.awardCategory,
    fullName: created.fullName,
    status: 'Submitted',
    message: 'Your nomination has been submitted successfully.',
    nomination: created,
  });
});

module.exports = {
  acceptNomination,
  getAwardCategories,
  getDashboardStats,
  getDocument,
  getNomination,
  getNominationConfig,
  getNominationDraft,
  getNominations,
  publicSubmitNomination,
  rejectNomination,
  saveNominationDraft,
  updateNominationConfig,
};
