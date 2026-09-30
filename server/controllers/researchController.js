const Research = require('../models/researchModel');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadResearchPdf } = require('../services/googleDriveService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendTemplateEmail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const cloudinaryConfigured = () => Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET);

const uploadFileHelper = async (file) => {
  if (!file) return null;
  if (cloudinaryConfigured()) {
    try {
      const result = await uploadToCloudinary(file.path, 'research', { resourceType: 'auto' });
      return result.secure_url;
    } catch (e) {
      console.warn("Cloudinary upload failed:", e);
    }
  }
  return `/uploads/research/${file.filename}`;
};

const validCategories = ['poster', 'oral', 'research_paper', 'case_report'];
const validStatuses = ['draft', 'submitted', 'under_review', 'revision_requested', 'revised_submitted', 'accepted', 'rejected', 'withdrawn'];
const reviewRoles = ['SUPER_ADMIN', 'ADMIN', 'RESEARCH', 'SCIENTIFIC_CHAIRPERSON', 'CHAIRPERSON', 'SCIENTIFIC_COMMITTEE_CHAIR'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const sanitizePayload = (body, fileOrFiles) => {
  const files = fileOrFiles?.pdf ? fileOrFiles : fileOrFiles ? { pdf: [fileOrFiles] } : null;
  return {
    title: body.title?.trim(),
    authors: body.authors?.trim() || body.presentingAuthor || body.name,
    presentingAuthor: body.presentingAuthor || body.presenting_author || body.name,
    correspondingAuthor: body.correspondingAuthor || body.corresponding_author,
    institution: body.institution?.trim() || body.college?.trim(),
    email: body.email?.trim(),
    phone: body.phone?.trim(),
    country: body.country?.trim(),
    city_state: (body.cityState || body.city_state)?.trim(),
    country_id: body.countryId || body.country_id || null,
    state_id: body.stateId || body.state_id || null,
    city_id: body.cityId || body.city_id || null,
    specialty: body.specialty?.trim(),
    year_of_study: (body.yearOfStudy || body.year_of_study)?.trim(),
    categoryId: body.categoryId || body.category_id,
    category: body.category || 'poster',
    track: body.track?.trim(),
    keywords: body.keywords?.trim(),
    abstractText: body.abstractText || body.abstract_text || 'See attached PDF',
    pdfUrl: body.pdfUrl || body.pdf_url || (files?.pdf ? `/uploads/research/${files.pdf[0].filename}` : null),
    declaration_url: body.declaration_url || (files?.declaration ? `/uploads/research/${files.declaration[0].filename}` : null),
    status: body.status || 'draft',
    awardNomination: toBoolean(body.awardNomination ?? body.award_nomination),
  };
};

const logDecision = (req, action, recordId, metadata = null) =>
  ActivityLog.logActivity({ userId: req.user?.id || null, action, module: 'scientific', recordId: String(recordId), metadata }).catch(() => {});

const revisionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const getPublicAppUrl = () => {
  const configured = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.APP_URL;
  return String(configured || 'http://localhost:5173').replace(/\/+$/, '');
};

const getRevisionContact = () =>
  process.env.SCIENTIFIC_COMMITTEE_EMAIL || process.env.CONTACT_EMAIL || 'scientific@ghc2026.org';

const getAbstractWhatsappGroupUrl = () =>
  process.env.ABSTRACT_WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/KX8RTHC6qCS5AwoDgXxq1D';

const getParticipationTokenTtlDays = () => Number(process.env.PARTICIPATION_TOKEN_TTL_DAYS || 30);

const createParticipationLinkForSubmission = async (req, submission) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + getParticipationTokenTtlDays() * 24 * 60 * 60 * 1000);
  await Research.createParticipationToken(submission.id, token, expires, {
    applicantEmail: submission.email,
    createdBy: req.user?.id || null,
  });
  return {
    link: `${getPublicAppUrl()}/abstract/confirm/${token}`,
    expires,
  };
};

const buildRevisionPointVariables = (notes = '') => {
  const points = String(notes || '')
    .split(/\r?\n|;/)
    .map((point) => point.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);
  return {
    revision_point_1: points[0] || 'Please revise your abstract according to the Scientific Committee comments.',
    revision_point_2: points[1] || 'Clarify or improve the sections highlighted by the Scientific Committee.',
    revision_point_3: points[2] || 'Review formatting, completeness, and final submission details before resubmitting.',
  };
};

const mapRevisionTokenError = (tokenRecord) => {
  if (!tokenRecord) return { status: 404, message: 'Invalid revision link.', code: 'invalid' };
  if (tokenRecord.used_at || tokenRecord.status === 'used') {
    return { status: 410, message: 'This revision link has already been used.', code: 'used' };
  }
  if (tokenRecord.status !== 'active' || new Date(tokenRecord.expires_at) <= new Date()) {
    return {
      status: 410,
      message: 'This revision link has expired. Please contact the GHC Scientific Committee if you need a new revision link.',
      code: 'expired',
    };
  }
  if (tokenRecord.abstract_status !== 'revision_requested') {
    return { status: 409, message: 'This abstract is no longer awaiting revision.', code: 'not_awaiting_revision' };
  }
  return null;
};

const publicRevisionPayload = (submission) => ({
  id: submission.abstractId,
  title: submission.title,
  applicantName: submission.presentingAuthor || submission.authors || 'Applicant',
  abstractText: submission.abstractText,
  category: submission.category,
  track: submission.track,
  keywords: submission.keywords,
  currentVersion: submission.currentVersion,
  pdfUrl: submission.pdfUrl,
  declarationUrl: submission.declarationUrl,
  revisionComments: submission.revisionComments || submission.reviewNotes || '',
  revisionDeadline: submission.revisionDeadline,
  contactEmail: getRevisionContact(),
});

const sendAbstractDecisionEmail = async (req, submission, status, notes = '') => {
  if (!['accepted', 'rejected'].includes(status) || !submission?.email) {
    return false;
  }

  const templateKey = status === 'accepted' ? 'abstract_accepted' : 'abstract_rejected';
  const action = status === 'accepted' ? 'abstract_acceptance_email_sent' : 'abstract_rejection_email_sent';
  const failureAction = status === 'accepted' ? 'abstract_acceptance_email_failed' : 'abstract_rejection_email_failed';
  const recipientName = submission.presentingAuthor || submission.authors || 'Author';

  try {
    const participation = status === 'accepted'
      ? await createParticipationLinkForSubmission(req, submission)
      : { link: '', expires: null };
    await sendTemplateEmail(templateKey, submission.email, {
      fullName: recipientName,
      name: recipientName,
      abstractTitle: submission.title,
      abstract_title: submission.title,
      title: submission.title,
      abstractCode: submission.abstractId || `GHC-ABS-${String(submission.id).padStart(5, '0')}`,
      category: submission.category || '',
      reviewComments: notes || submission.reviewNotes || '',
      contactEmail: getRevisionContact(),
      participationLink: participation.link,
      registration_link: participation.link,
      participationExpiresAt: participation.expires ? participation.expires.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '',
      whatsappGroupLink: getAbstractWhatsappGroupUrl(),
    });
    await logDecision(req, action, submission.id, { email: submission.email });
    return true;
  } catch (mailErr) {
    await logDecision(req, failureAction, submission.id, { email: submission.email, error: mailErr.message });
    return false;
  }
};

const validate = (payload) => {
  if (!payload.title) return 'Title is required';
  if (!validCategories.includes(payload.category)) return 'Invalid category';
  if (!validStatuses.includes(payload.status)) return 'Invalid status';
  return null;
};

const validateLocationDb = async (payload) => {
  if (payload.country_id && payload.state_id && payload.city_id) {
    const [rows] = await pool.query(`
      SELECT c.id FROM cities c
      JOIN states s ON c.state_id = s.id
      JOIN countries co ON s.country_id = co.id
      WHERE c.id = ? AND s.id = ? AND co.id = ?
    `, [payload.city_id, payload.state_id, payload.country_id]);
    if (rows.length === 0) return 'Invalid geographic location relationship selected';
  }
  return null;
};

const validatePublicSubmission = (payload, files) => {
  if (!payload.presentingAuthor) return 'Personal details are required';
  if (!payload.email) return 'Email is required';
  if (!payload.institution) return 'Institution is required';
  if (!payload.title) return 'Title is required';
  if (!validCategories.includes(payload.category)) return 'Invalid category';
  if (!files?.pdf) return 'Abstract PDF upload is required';
  if (!files?.declaration) return 'Declaration form upload is required';
  return null;
};

const listResearch = asyncHandler(async (req, res) => {
  const isSuperOrAdmin = reviewRoles.includes(req.user?.role) || req.user?.permissions?.includes('manage_abstracts') || req.user?.permissions?.includes('assign_reviewers');
  const includeAll = req.query.admin === '1' || isSuperOrAdmin;
  const isReviewer = !isSuperOrAdmin && req.user?.permissions?.includes('review_abstracts');
  const reviewerId = isReviewer ? req.user.id : null;
  const limit = req.query.limit ? Math.min(Math.max(Number(req.query.limit || 50), 1), 200) : null;
  const page = Math.max(Number(req.query.page || 1), 1);
  const offset = limit ? (page - 1) * limit : 0;
  const compact = req.query.compact === '1';

  const submissions = await Research.list({ includeAll, reviewerId, limit, offset, compact });
  res.json({ submissions, pagination: limit ? { page, limit, count: submissions.length } : null });
});

const getResearch = asyncHandler(async (req, res) => {
  const submission = await Research.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  
  const isSuperOrAdmin = reviewRoles.includes(req.user?.role) || req.user?.permissions?.includes('manage_abstracts');
  const isReviewer = !isSuperOrAdmin && req.user?.permissions?.includes('review_abstracts');
  
  if (isReviewer && submission.reviewerId !== req.user.id) {
    return res.status(403).json({ message: 'You are not authorized to view this submission.' });
  }
  
  return res.json({ submission });
});

const createResearch = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, req.file);
  let error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  error = await validateLocationDb(payload);
  if (error) return res.status(400).json({ message: error });

  if (req.file) {
    const uploadedUrl = await uploadFileHelper(req.file);
    if (uploadedUrl) payload.pdfUrl = uploadedUrl;
  }

  const submission = await Research.create(payload);
  await logDecision(req, 'created_abstract', submission.id);
  return res.status(201).json({ submission });
});

const submitResearch = asyncHandler(async (req, res) => {
  const payload = {
    ...sanitizePayload(req.body, req.files),
    status: 'submitted',
  };
  let error = validatePublicSubmission(payload, req.files);
  if (error) return res.status(400).json({ message: error });

  error = await validateLocationDb(payload);
  if (error) return res.status(400).json({ message: error });

  const driveUpload = await uploadResearchPdf({
    file: req.files?.pdf?.[0],
    category: payload.category,
    title: payload.title,
  });

  const pdfCloudinaryUrl = await uploadFileHelper(req.files?.pdf?.[0]);
  if (pdfCloudinaryUrl) {
    payload.pdfUrl = pdfCloudinaryUrl;
  } else if (driveUpload?.webViewLink) {
    payload.pdfUrl = driveUpload.webViewLink;
  }

  const declUpload = await uploadResearchPdf({
    file: req.files?.declaration?.[0],
    category: payload.category,
    title: payload.title,
    suffix: 'declaration'
  });

  const declCloudinaryUrl = await uploadFileHelper(req.files?.declaration?.[0]);
  if (declCloudinaryUrl) {
    payload.declaration_url = declCloudinaryUrl;
  } else if (declUpload?.webViewLink) {
    payload.declaration_url = declUpload.webViewLink;
  }

  const submission = await Research.create(payload);
  await logDecision(req, 'submitted_abstract', submission.id);
  return res.status(201).json({
    success: true,
    submission,
    drive: driveUpload || {
      configured: false,
      folder: `GHC2026/${payload.category === 'oral' ? 'Oral' : 'Poster'}`,
      message: 'Google Drive service account is not configured; file was stored locally.',
    },
  });
});

const updateResearch = asyncHandler(async (req, res) => {
  const existing = await Research.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Research submission not found' });

  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  if (req.file) {
    const uploadedUrl = await uploadFileHelper(req.file);
    if (uploadedUrl) payload.pdfUrl = uploadedUrl;
  }

  const submission = await Research.update(req.params.id, payload);
  await logDecision(req, 'updated_abstract', req.params.id);
  return res.json({ submission });
});



const reviewResearch = asyncHandler(async (req, res) => {
  const status = req.body.status || 'under_review';
  if (!['under_review', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid review status' });
  }

  const existing = await Research.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Research submission not found' });
  
  const isSuperOrAdmin = reviewRoles.includes(req.user?.role) || req.user?.permissions?.includes('manage_abstracts');
  const isReviewer = !isSuperOrAdmin && req.user?.permissions?.includes('review_abstracts');
  
  if (isReviewer && existing.reviewerId !== req.user.id) {
    return res.status(403).json({ message: 'You are not authorized to review this submission.' });
  }

  if (['accepted', 'rejected'].includes(existing.status)) {
    return res.status(403).json({ message: 'Final review decision cannot be changed.' });
  }

  const submission = await Research.review(req.params.id, {
    reviewScore: req.body.reviewScore ?? req.body.review_score ?? null,
    reviewNotes: req.body.reviewNotes || req.body.review_notes,
    reviewerId: req.user?.id,
    status,
    awardNomination: toBoolean(req.body.awardNomination ?? req.body.award_nomination),
  });

  await logDecision(req, 'review_decision', req.params.id, { status, score: req.body.reviewScore ?? req.body.review_score ?? null });
  const emailSent = await sendAbstractDecisionEmail(req, submission, status, req.body.reviewNotes || req.body.review_notes);
  return res.json({ submission, emailSent });
});

const statusResearch = asyncHandler(async (req, res) => {
  if (!validStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  
  const existing = await Research.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Research submission not found' });
  if (['accepted', 'rejected'].includes(existing.status)) {
    return res.status(403).json({ message: 'Final review decision cannot be changed.' });
  }

  const submission = await Research.setStatus(req.params.id, req.body.status);
  await logDecision(req, 'status_decision', req.params.id, { status: req.body.status });
  const emailSent = await sendAbstractDecisionEmail(req, submission, req.body.status, req.body.notes || req.body.reviewNotes || existing.reviewNotes);
  return res.json({ submission, emailSent });
});

const awardResearch = asyncHandler(async (req, res) => {
  const submission = await Research.setAward(req.params.id, toBoolean(req.body.awardNomination ?? req.body.award_nomination));
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ submission });
});

const researchStats = asyncHandler(async (_req, res) => {
  const stats = await Research.stats();
  const [[extra]] = await pool.query(`
    SELECT
      SUM(category = 'poster') AS posterPresentations,
      SUM(category = 'oral') AS oralPresentations,
      (SELECT COUNT(*) FROM reviewers) AS assignedReviewers,
      (SELECT COUNT(*) FROM presentation_sessions WHERE date >= CURDATE()) AS upcomingScientificSessions
    FROM abstracts
  `);
  const [activity] = await pool.query("SELECT * FROM activity_logs WHERE module IN ('scientific','research') ORDER BY timestamp DESC LIMIT 10");
  return res.json({
    stats: {
      ...stats,
      posterPresentations: Number(extra.posterPresentations || 0),
      oralPresentations: Number(extra.oralPresentations || 0),
      assignedReviewers: Number(extra.assignedReviewers || 0),
      upcomingScientificSessions: Number(extra.upcomingScientificSessions || 0),
    },
    recentActivity: activity,
  });
});

const listRows = (table, key, order = 'id DESC') => asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(`SELECT * FROM ${table} ORDER BY ${order}`);
  res.json({ [key]: rows });
});

const saveCategory = asyncHandler(async (req, res) => {
  const payload = [req.body.name, req.body.description || null, req.body.submissionType || req.body.submission_type || 'poster', req.body.isActive !== false];
  let id = req.params.id;
  if (id) await pool.query('UPDATE abstract_categories SET name=?, description=?, submission_type=?, is_active=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO abstract_categories (name, description, submission_type, is_active) VALUES (?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_abstract_category' : 'created_abstract_category', id);
  res.json({ id });
});

const getReviewerForUser = async (userId) => {
  const [[reviewer]] = await pool.query('SELECT * FROM reviewers WHERE user_id = ? LIMIT 1', [userId]);
  return reviewer;
};

const listReviewers = asyncHandler(async (_req, res) => {
  const [reviewers] = await pool.query(`
    SELECT r.*, u.name, u.email,
      COUNT(DISTINCT ara.abstract_id) AS assigned_count,
      COUNT(DISTINCT ar.id) AS completed_reviews,
      SUM(CASE WHEN ar.recommendation = 'accept' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN ar.recommendation = 'reject' THEN 1 ELSE 0 END) AS rejected_count,
      SUM(CASE WHEN ar.recommendation = 'revise' THEN 1 ELSE 0 END) AS revision_count
    FROM reviewers r
    INNER JOIN users u ON u.id = r.user_id
    LEFT JOIN abstract_review_assignments ara ON ara.reviewer_id = r.id
    LEFT JOIN abstract_reviews ar ON ar.reviewer_id = r.id
    GROUP BY r.id
    ORDER BY u.name ASC
  `);

  const enriched = reviewers.map((rev) => {
    const assigned = Number(rev.assigned_count || 0);
    const completed = Number(rev.completed_reviews || 0);
    const approved = Number(rev.approved_count || 0);
    const rejected = Number(rev.rejected_count || 0);
    const revision = Number(rev.revision_count || 0);
    const pending = Math.max(0, assigned - completed);
    const completion = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
    return {
      ...rev,
      status: rev.status || 'active',
      reinstatement_status: rev.reinstatement_status || 'none',
      assigned_count: assigned,
      completed_reviews: completed,
      total_reviews: completed,
      approved_count: approved,
      rejected_count: rejected,
      revision_count: revision,
      pending_count: pending,
      completion_rate: completion,
    };
  });

  res.json({ reviewers: enriched });
});

const saveReviewer = asyncHandler(async (req, res) => {
  let userId = req.body.userId || req.body.user_id;

  // Support adding a new reviewer user directly by Chairperson / Super Admin
  if (!userId && req.body.email && req.body.name) {
    const email = req.body.email.trim().toLowerCase();
    const name = req.body.name.trim();

    // Find SCIENTIFIC_REVIEWER role
    const [[roleRow]] = await pool.query("SELECT id FROM roles WHERE name IN ('SCIENTIFIC_REVIEWER', 'REVIEWER') ORDER BY id DESC LIMIT 1");
    const roleId = roleRow?.id || 987;

    const [[existingUser]] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (existingUser) {
      userId = existingUser.id;
      if (existingUser.role_id !== 1) {
        await pool.query('UPDATE users SET role_id = ? WHERE id = ?', [roleId, userId]);
      }
    } else {
      const plainPassword = req.body.password || 'Reviewer@123';
      const passwordHash = await bcrypt.hash(plainPassword, 12);
      const [insertUser] = await pool.query(
        'INSERT INTO users (name, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
        [name, email, passwordHash, roleId]
      );
      userId = insertUser.insertId;
    }
  }

  if (!userId) {
    return res.status(400).json({ message: 'User ID or Name and Email are required to create a reviewer.' });
  }

  const specialization = req.body.specialization?.trim() || null;
  const designation = req.body.designation?.trim() || null;
  const institution = req.body.institution?.trim() || null;
  const country = req.body.country?.trim() || 'India';

  let id = req.params.id;
  if (id) {
    await pool.query(
      'UPDATE reviewers SET user_id=?, specialization=?, designation=?, institution=?, country=? WHERE id=?',
      [userId, specialization, designation, institution, country, id]
    );
  } else {
    const [result] = await pool.query(
      `INSERT INTO reviewers (user_id, specialization, designation, institution, country, status)
       VALUES (?, ?, ?, ?, ?, 'active')
       ON DUPLICATE KEY UPDATE 
         specialization=VALUES(specialization), 
         designation=VALUES(designation), 
         institution=VALUES(institution), 
         country=VALUES(country),
         status='active'`,
      [userId, specialization, designation, institution, country]
    );
    id = result.insertId || id;
  }

  await logDecision(req, req.params.id ? 'updated_reviewer' : 'created_reviewer', id, { userId });
  res.json({ success: true, id, userId });
});

const suspendReviewer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status = 'suspended', reason = '' } = req.body;
  const isSuspended = status === 'suspended';

  await pool.query(
    `UPDATE reviewers 
     SET status = ?, 
         suspension_reason = ?, 
         suspended_at = ?, 
         suspended_by = ?,
         reinstatement_status = ?
     WHERE id = ?`,
    [
      status,
      isSuspended ? (reason || 'Administrative suspension') : null,
      isSuspended ? new Date() : null,
      isSuspended ? req.user?.id : null,
      isSuspended ? 'none' : 'approved',
      id,
    ]
  );

  await logDecision(req, isSuspended ? 'suspended_reviewer' : 'unsuspended_reviewer', id, { reason });
  res.json({ success: true, status });
});

const applyReinstatement = asyncHandler(async (req, res) => {
  const reviewer = await getReviewerForUser(req.user?.id);
  if (!reviewer) {
    return res.status(404).json({ message: 'Reviewer profile not found' });
  }

  const { reason = '' } = req.body;
  await pool.query(
    `UPDATE reviewers 
     SET reinstatement_status = 'pending', 
         reinstatement_reason = ?, 
         reinstatement_requested_at = NOW() 
     WHERE id = ?`,
    [reason || 'Reviewer requested reinstatement', reviewer.id]
  );

  await logDecision(req, 'reviewer_applied_reinstatement', reviewer.id, { reason });
  res.json({ success: true, message: 'Reinstatement request submitted successfully' });
});

const reinstateReviewer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query(
    `UPDATE reviewers 
     SET status = 'active', 
         suspension_reason = NULL, 
         suspended_at = NULL, 
         reinstatement_status = 'approved'
     WHERE id = ?`,
    [id]
  );

  await logDecision(req, 'reinstated_reviewer', id);
  res.json({ success: true, status: 'active' });
});

const getMyReviewerProfile = asyncHandler(async (req, res) => {
  const reviewer = await getReviewerForUser(req.user?.id);
  res.json({ reviewer: reviewer || null });
});

const assignReviewer = asyncHandler(async (req, res) => {
  await pool.query('INSERT IGNORE INTO abstract_review_assignments (abstract_id, reviewer_id) VALUES (?, ?)', [req.params.id, req.body.reviewerId || req.body.reviewer_id]);
  await Research.setStatus(req.params.id, 'under_review');
  await logDecision(req, 'assigned_reviewer', req.params.id, { reviewerId: req.body.reviewerId || req.body.reviewer_id });
  res.json({ success: true });
});

const removeReviewerAssignment = asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM abstract_review_assignments WHERE abstract_id = ? AND reviewer_id = ?', [req.params.id, req.params.reviewerId]);
  await logDecision(req, 'removed_reviewer_assignment', req.params.id, { reviewerId: req.params.reviewerId });
  res.status(204).send();
});

const assignedReviews = asyncHandler(async (req, res) => {
  const reviewer = await getReviewerForUser(req.user?.id);
  if (reviewer && reviewer.status === 'suspended') {
    return res.json({
      suspended: true,
      reviewer,
      assignments: [],
      message: 'Your scientific reviewer access has been temporarily suspended.',
    });
  }

  if (!reviewer && req.user?.role !== 'SUPER_ADMIN') return res.json({ assignments: [] });
  const params = reviewer ? [reviewer.id] : [];
  const where = reviewer ? 'WHERE ara.reviewer_id = ?' : '';
  const [assignments] = await pool.query(`
    SELECT 
      ara.*, 
      a.abstract_id AS abstractCode, 
      a.title, 
      a.authors,
      a.institution,
      a.track,
      a.category, 
      a.keywords, 
      a.abstract_text, 
      a.file_url, 
      a.pdf_url,
      a.status, 
      a.submission_status,
      ar.id AS review_id,
      ar.total_score,
      ar.recommendation,
      ar.reviewed_at,
      CASE WHEN ar.id IS NOT NULL THEN 'completed' ELSE 'pending' END AS review_state
    FROM abstract_review_assignments ara
    INNER JOIN abstracts a ON a.id = ara.abstract_id
    LEFT JOIN abstract_reviews ar ON ar.abstract_id = ara.abstract_id AND ar.reviewer_id = ara.reviewer_id
    ${where}
    ORDER BY ara.assigned_at DESC
  `, params);
  res.json({ assignments, suspended: false, reviewer });
});

const submitScore = asyncHandler(async (req, res) => {
  const reviewer = await getReviewerForUser(req.user?.id);
  if (reviewer && reviewer.status === 'suspended') {
    return res.status(403).json({ message: 'Your reviewer account is suspended. You cannot submit evaluations.' });
  }

  const reviewerId = req.body.reviewerId || req.body.reviewer_id || reviewer?.id;
  if (!reviewerId) return res.status(403).json({ message: 'Reviewer profile required' });
  const assigned = await pool.query('SELECT id FROM abstract_review_assignments WHERE abstract_id = ? AND reviewer_id = ? LIMIT 1', [req.params.id, reviewerId]);
  if (!assigned[0].length && req.user?.role !== 'SUPER_ADMIN') return res.status(403).json({ message: 'Abstract is not assigned to this reviewer' });

  const scores = ['scientificMerit', 'originality', 'methodology', 'presentationQuality', 'relevance'].map((key) => Number(req.body[key] || req.body[key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] || 0));
  const total = scores.reduce((sum, value) => sum + value, 0);
  await pool.query(
    `INSERT INTO abstract_reviews (abstract_id, reviewer_id, scientific_merit, originality, methodology, presentation_quality, relevance, comments, recommendation, total_score)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE scientific_merit=VALUES(scientific_merit), originality=VALUES(originality), methodology=VALUES(methodology), presentation_quality=VALUES(presentation_quality), relevance=VALUES(relevance), comments=VALUES(comments), recommendation=VALUES(recommendation), total_score=VALUES(total_score), reviewed_at=CURRENT_TIMESTAMP`,
    [req.params.id, reviewerId, ...scores, req.body.comments || null, req.body.recommendation || 'revise', total]
  );
  await pool.query('UPDATE abstracts SET final_score = (SELECT AVG(total_score) FROM abstract_reviews WHERE abstract_id = ?) WHERE id = ?', [req.params.id, req.params.id]);
  await logDecision(req, 'submitted_review', req.params.id, { reviewerId, recommendation: req.body.recommendation, total });
  res.json({ totalScore: total });
});

const listReviews = asyncHandler(async (req, res) => {
  const reviewer = req.user?.permissions?.includes('manage_abstracts') || req.user?.role === 'SUPER_ADMIN' ? null : await getReviewerForUser(req.user?.id);
  const where = reviewer ? 'WHERE ar.reviewer_id = ?' : '';
  const [reviews] = await pool.query(`
    SELECT ar.*, a.title, a.abstract_id AS abstractCode, a.category, a.track, a.abstract_text, a.pdf_url, a.file_url, a.status AS abstract_status,
           a.presenting_author, a.authors, a.institution, a.email AS author_email, a.review_notes, a.review_score,
           u.name AS reviewer_name, u.email AS reviewer_email, r.specialization
    FROM abstract_reviews ar
    INNER JOIN abstracts a ON a.id = ar.abstract_id
    INNER JOIN reviewers r ON r.id = ar.reviewer_id
    INNER JOIN users u ON u.id = r.user_id
    ${where}
    ORDER BY ar.reviewed_at DESC
  `, reviewer ? [reviewer.id] : []);
  res.json({ reviews });
});

const rankingBaseCte = `
  WITH review_summary AS (
    SELECT
      a.id AS abstract_id,
      COUNT(DISTINCT ara.reviewer_id) AS assigned_count,
      COUNT(DISTINCT ar.reviewer_id) AS completed_count,
      MAX(ar.reviewed_at) AS last_reviewed_at
    FROM abstracts a
    LEFT JOIN abstract_review_assignments ara ON ara.abstract_id = a.id
    LEFT JOIN abstract_reviews ar ON ar.abstract_id = a.id AND ar.reviewer_id = ara.reviewer_id
    GROUP BY a.id
  ),
  official_rankings AS (
    SELECT
      a.id AS abstract_id,
      RANK() OVER (ORDER BY a.final_score DESC) AS official_position
    FROM abstracts a
    INNER JOIN review_summary rs ON rs.abstract_id = a.id
    WHERE rs.assigned_count > 0
      AND rs.completed_count = rs.assigned_count
      AND a.final_score IS NOT NULL
  )
`;

const buildRankingWhere = (query = {}) => {
  const clauses = [];
  const params = [];
  const reviewStatus = query.reviewStatus || 'fully_reviewed';

  if (reviewStatus === 'fully_reviewed') {
    clauses.push('rs.assigned_count > 0 AND rs.completed_count = rs.assigned_count AND a.final_score IS NOT NULL');
  } else if (reviewStatus === 'pending_review') {
    clauses.push('(rs.assigned_count = 0 OR rs.completed_count < rs.assigned_count OR a.final_score IS NULL)');
  }

  if (query.category && query.category !== 'all') {
    clauses.push('a.category = ?');
    params.push(query.category);
  }

  if (query.ugPg && query.ugPg !== 'all') {
    clauses.push('LOWER(COALESCE(a.year_of_study, "")) LIKE ?');
    params.push(`%${String(query.ugPg).toLowerCase()}%`);
  }

  if (query.institution) {
    clauses.push('a.institution LIKE ?');
    params.push(`%${query.institution}%`);
  }

  if (query.status && query.status !== 'all') {
    clauses.push('COALESCE(a.submission_status, a.status) = ?');
    params.push(query.status);
  }

  if (query.scoreMin !== undefined && query.scoreMin !== '') {
    clauses.push('a.final_score >= ?');
    params.push(Number(query.scoreMin));
  }

  if (query.scoreMax !== undefined && query.scoreMax !== '') {
    clauses.push('a.final_score <= ?');
    params.push(Number(query.scoreMax));
  }

  if (query.search) {
    const term = `%${query.search}%`;
    clauses.push('(a.abstract_id LIKE ? OR a.title LIKE ? OR a.presenting_author LIKE ? OR a.authors LIKE ? OR a.institution LIKE ?)');
    params.push(term, term, term, term, term);
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
};

const rankingSelectSql = `
  SELECT
    orank.official_position AS position,
    a.id,
    a.abstract_id AS abstractId,
    a.title,
    COALESCE(a.presenting_author, a.authors) AS applicantName,
    a.institution,
    a.category,
    a.year_of_study AS yearOfStudy,
    COALESCE(a.submission_status, a.status) AS abstractStatus,
    CASE
      WHEN rs.assigned_count > 0 AND rs.completed_count = rs.assigned_count AND a.final_score IS NOT NULL THEN 'fully_reviewed'
      WHEN rs.completed_count > 0 THEN 'partially_reviewed'
      ELSE 'pending_review'
    END AS reviewStatus,
    a.final_score AS finalScore,
    50 AS maximumScore,
    CASE WHEN a.final_score IS NULL THEN NULL ELSE ROUND((a.final_score / 50) * 100, 2) END AS percentage,
    rs.assigned_count AS assignedReviewers,
    rs.completed_count AS completedReviews,
    rs.last_reviewed_at AS lastReviewedAt
  FROM abstracts a
  INNER JOIN review_summary rs ON rs.abstract_id = a.id
  LEFT JOIN official_rankings orank ON orank.abstract_id = a.id
`;

const rankingSortSql = (sort = 'position', direction = 'asc') => {
  const dir = String(direction).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const map = {
    position: `(orank.official_position IS NULL) ASC, orank.official_position ${dir}, a.final_score DESC`,
    score: `a.final_score ${dir}, orank.official_position ASC`,
    category: `a.category ${dir}, orank.official_position ASC`,
    ugPg: `a.year_of_study ${dir}, orank.official_position ASC`,
    institution: `a.institution ${dir}, orank.official_position ASC`,
    reviewStatus: `reviewStatus ${dir}, orank.official_position ASC`,
    status: `abstractStatus ${dir}, orank.official_position ASC`,
    title: `a.title ${dir}, orank.official_position ASC`,
  };
  return `ORDER BY ${map[sort] || map.position}`;
};

const listAbstractRankings = asyncHandler(async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100);
  const page = Math.max(Number(req.query.page || 1), 1);
  const offset = (page - 1) * limit;
  const { where, params } = buildRankingWhere(req.query);
  const orderBy = rankingSortSql(req.query.sort, req.query.direction);

  const [rows] = await pool.query(
    `${rankingBaseCte}
     ${rankingSelectSql}
     ${where}
     ${orderBy}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [[countRow]] = await pool.query(
    `${rankingBaseCte}
     SELECT COUNT(*) AS total
     FROM abstracts a
     INNER JOIN review_summary rs ON rs.abstract_id = a.id
     LEFT JOIN official_rankings orank ON orank.abstract_id = a.id
     ${where}`,
    params
  );

  const [[summary]] = await pool.query(`
    ${rankingBaseCte}
    SELECT
      COUNT(*) AS eligibleTotal,
      MAX(a.final_score) AS highestScore,
      AVG(a.final_score) AS averageScore,
      MIN(a.final_score) AS lowestScore
    FROM abstracts a
    INNER JOIN review_summary rs ON rs.abstract_id = a.id
    WHERE rs.assigned_count > 0
      AND rs.completed_count = rs.assigned_count
      AND a.final_score IS NOT NULL
  `);

  await logDecision(req, 'viewed_abstract_rankings', null, {
    page,
    limit,
    reviewStatus: req.query.reviewStatus || 'fully_reviewed',
  });

  res.json({
    rankings: rows.map((row) => ({
      ...row,
      position: row.position === null ? null : Number(row.position),
      finalScore: row.finalScore === null ? null : Number(row.finalScore),
      maximumScore: Number(row.maximumScore || 50),
      percentage: row.percentage === null ? null : Number(row.percentage),
      assignedReviewers: Number(row.assignedReviewers || 0),
      completedReviews: Number(row.completedReviews || 0),
    })),
    summary: {
      totalEligible: Number(summary.eligibleTotal || 0),
      highestScore: summary.highestScore === null ? null : Number(summary.highestScore),
      averageScore: summary.averageScore === null ? null : Number(summary.averageScore),
      lowestScore: summary.lowestScore === null ? null : Number(summary.lowestScore),
      rankingMethod: 'Average of submitted reviewer total scores',
      tieHandling: 'Competition ranking: equal scores share the same position and the next position is skipped.',
    },
    pagination: {
      page,
      limit,
      total: Number(countRow.total || 0),
      totalPages: Math.ceil(Number(countRow.total || 0) / limit),
    },
  });
});

const exportAbstractRankingsCsv = asyncHandler(async (req, res) => {
  const { where, params } = buildRankingWhere({ ...req.query, reviewStatus: req.query.reviewStatus || 'fully_reviewed' });
  const orderBy = rankingSortSql(req.query.sort, req.query.direction);
  const [rows] = await pool.query(
    `${rankingBaseCte}
     ${rankingSelectSql}
     ${where}
     ${orderBy}`,
    params
  );

  await logDecision(req, 'exported_abstract_rankings', null, { count: rows.length });

  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const headers = [
    'Position',
    'Abstract ID',
    'Title',
    'Applicant',
    'Institution',
    'Category',
    'UG/PG',
    'Final Score',
    'Maximum Score',
    'Percentage',
    'Review Status',
    'Abstract Status',
  ];
  const csvRows = rows.map((row) => [
    row.position || '',
    row.abstractId || '',
    row.title || '',
    row.applicantName || '',
    row.institution || '',
    row.category || '',
    row.yearOfStudy || '',
    row.finalScore ?? '',
    row.maximumScore || 50,
    row.percentage ?? '',
    row.reviewStatus || '',
    row.abstractStatus || '',
  ].map(escapeCsv).join(','));

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="abstract_rankings.csv"');
  res.status(200).send([headers.join(','), ...csvRows].join('\n'));
});

const saveSettings = asyncHandler(async (req, res) => {
  await pool.query(
    `INSERT INTO scientific_settings (setting_key, setting_value) VALUES ('submission_settings', ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [JSON.stringify(req.body)]
  );
  await logDecision(req, 'updated_scientific_settings', 'submission_settings');
  res.json({ settings: req.body });
});

const getSettings = asyncHandler(async (_req, res) => {
  const [[row]] = await pool.query("SELECT setting_value FROM scientific_settings WHERE setting_key = 'submission_settings' LIMIT 1");
  res.json({ settings: typeof row?.setting_value === 'string' ? JSON.parse(row.setting_value) : row?.setting_value || {} });
});

const saveCriteria = asyncHandler(async (req, res) => {
  const payload = [req.body.name, Number(req.body.weight || 1), req.body.isActive !== false];
  let id = req.params.id;
  if (id) await pool.query('UPDATE scoring_criteria SET name=?, weight=?, is_active=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO scoring_criteria (name, weight, is_active) VALUES (?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_scoring_criteria' : 'created_scoring_criteria', id);
  res.json({ id });
});

const savePresentationSession = asyncHandler(async (req, res) => {
  const payload = [req.body.title, req.body.sessionType || req.body.session_type || 'poster', req.body.hallId || req.body.hall_id || null, req.body.date || null, req.body.startTime || req.body.start_time || null, req.body.endTime || req.body.end_time || null];
  let id = req.params.id;
  if (id) await pool.query('UPDATE presentation_sessions SET title=?, session_type=?, hall_id=?, date=?, start_time=?, end_time=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO presentation_sessions (title, session_type, hall_id, date, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_presentation_session' : 'created_presentation_session', id);
  res.json({ id });
});

const assignPresentation = asyncHandler(async (req, res) => {
  await pool.query(
    `INSERT INTO presentation_assignments (abstract_id, session_id, presentation_order, poster_number, poster_url)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE session_id=VALUES(session_id), presentation_order=VALUES(presentation_order), poster_number=VALUES(poster_number), poster_url=VALUES(poster_url)`,
    [req.body.abstractId || req.body.abstract_id, req.body.sessionId || req.body.session_id, Number(req.body.presentationOrder || 0), req.body.posterNumber || null, req.body.posterUrl || null]
  );
  await logDecision(req, 'assigned_presentation', req.body.abstractId || req.body.abstract_id);
  res.json({ success: true });
});

const saveJudge = asyncHandler(async (req, res) => {
  const payload = [req.body.userId || req.body.user_id, req.body.specialization || null, req.body.designation || null];
  let id = req.params.id;
  if (id) await pool.query('UPDATE judges SET user_id=?, specialization=?, designation=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO judges (user_id, specialization, designation) VALUES (?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_judge' : 'created_judge', id);
  res.json({ id });
});

const saveAward = asyncHandler(async (req, res) => {
  const payload = [req.body.name, req.body.description || null, req.body.category || null, req.body.prize || null];
  let id = req.params.id;
  if (id) await pool.query('UPDATE awards SET name=?, description=?, category=?, prize=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO awards (name, description, category, prize) VALUES (?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_award' : 'created_award', id);
  res.json({ id });
});

const saveAwardResult = asyncHandler(async (req, res) => {
  const [result] = await pool.query('INSERT INTO award_results (award_id, abstract_id, `rank`, score) VALUES (?, ?, ?, ?)', [req.body.awardId, req.body.abstractId, req.body.rank, req.body.score]);
  await logDecision(req, 'created_award_result', result.insertId, req.body);
  res.json({ id: result.insertId });
});

const scientificReports = asyncHandler(async (_req, res) => {
  const series = async (sql) => {
    const [rows] = await pool.query(sql);
    return rows.map((row) => ({ label: row.label || 'Unknown', value: Number(row.value || 0) }));
  };
  res.json({
    charts: {
      submissionsByCategory: await series("SELECT COALESCE(ac.name, a.category, 'Unassigned') AS label, COUNT(*) AS value FROM abstracts a LEFT JOIN abstract_categories ac ON ac.id = a.category_id GROUP BY label"),
      submissionsByCountry: await series("SELECT COALESCE(country, 'Unknown') AS label, COUNT(*) AS value FROM abstracts GROUP BY label ORDER BY value DESC LIMIT 20"),
      acceptanceRate: await series("SELECT submission_status AS label, COUNT(*) AS value FROM abstracts GROUP BY submission_status"),
      reviewerPerformance: await series("SELECT u.name AS label, COUNT(ar.id) AS value FROM reviewers r INNER JOIN users u ON u.id = r.user_id LEFT JOIN abstract_reviews ar ON ar.reviewer_id = r.id GROUP BY u.name"),
      topInstitutions: await series("SELECT COALESCE(institution, 'Unknown') AS label, COUNT(*) AS value FROM abstracts GROUP BY label ORDER BY value DESC LIMIT 20"),
      awardStatistics: await series("SELECT a.name AS label, COUNT(ar.id) AS value FROM awards a LEFT JOIN award_results ar ON ar.award_id = a.id GROUP BY a.name"),
    },
  });
});

const updateIntegrity = asyncHandler(async (req, res) => {
  const submission = await Research.updateIntegrity(req.params.id, {
    aiPercentage: req.body.aiPercentage,
    plagiarismPercentage: req.body.plagiarismPercentage
  });
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  await logDecision(req, 'updated_integrity', req.params.id);
  return res.json({ submission });
});

const exportResearchCSV = asyncHandler(async (req, res) => {
  const submissions = await Research.list({ includeAll: true });
  
  if (!submissions || submissions.length === 0) {
    return res.status(404).send("No data found");
  }

  // Define CSV headers
  const headers = [
    "Abstract Code", "Title", "Presenting Author", "Email", "Institution", 
    "Category", "Track", "Status", "AI %", "Plagiarism %", "Final Score"
  ];
  
  // Format rows
  const rows = submissions.map(sub => [
    sub.abstractId || sub.id,
    `"${(sub.title || '').replace(/"/g, '""')}"`,
    `"${(sub.presentingAuthor || '').replace(/"/g, '""')}"`,
    `"${(sub.email || '').replace(/"/g, '""')}"`,
    `"${(sub.institution || '').replace(/"/g, '""')}"`,
    sub.category || '',
    sub.track || '',
    sub.status || '',
    sub.aiPercentage !== null ? sub.aiPercentage : '',
    sub.plagiarismPercentage !== null ? sub.plagiarismPercentage : '',
    sub.finalScore !== null ? sub.finalScore : ''
  ]);
  
  const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="abstracts_export.csv"');
  res.status(200).send(csvContent);
});

const emailParticipants = asyncHandler(async (req, res) => {
  const { subject, message, emails } = req.body;
  if (!subject || !message) return res.status(400).json({ message: "Subject and message are required" });
  
  // In a real application, you would integrate with an SMTP service (e.g. nodemailer or SendGrid) here.
  console.log(`[EMAIL SIMULATION] Sending email to ${emails?.length || 'all'} participants.`);
  console.log(`Subject: ${subject}`);
  console.log(`Message: ${message}`);
  
  await logDecision(req, 'emailed_participants', null, { subject, emailCount: emails?.length });
  
  res.json({ success: true, message: "Emails sent successfully (simulated)." });
});

const requestRevision = asyncHandler(async (req, res) => {
  const submission = await Research.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  
  if (['accepted', 'rejected'].includes(submission.status)) {
    return res.status(403).json({ message: 'Final review decision cannot be changed.' });
  }
  
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + Number(process.env.REVISION_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
  const notes = req.body?.notes || req.body?.comments || req.body?.revisionNotes || '';
  const authorEmail = submission.email;
  const link = `${getPublicAppUrl()}/abstract/revise/${token}`;

  await Research.requestRevision(submission.id, token, expires, {
    applicantEmail: authorEmail,
    abstractVersion: submission.currentVersion || 1,
    createdBy: req.user?.id || null,
    comments: notes,
  });
  await logDecision(req, 'revision_link_generated', submission.id, { expiresAt: expires, version: submission.currentVersion || 1 });
  
  let emailSent = false;
  if (authorEmail) {
    try {
      const subject = `Revision Requested: ${submission.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 2px solid #6C4AB6; padding-bottom: 12px; margin-bottom: 20px;">
            <strong style="color: #6C4AB6; font-size: 18px; text-transform: uppercase; letter-spacing: 0.05em;">Global Healthcare Conclave 2026</strong>
          </div>
          <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Revision Requested for Your Research Abstract</h2>
          <p style="font-size: 14px; line-height: 1.5;">Dear ${submission.presentingAuthor || submission.authors || 'Author'},</p>
          <p style="font-size: 14px; line-height: 1.5;">The Scientific Committee has reviewed your submission to <strong>Global Healthcare Conclave 2026</strong>:</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 700;">Abstract Code: ${submission.abstractId || `GHC-ABS-${String(submission.id).padStart(5, '0')}`}</div>
            <div style="font-size: 15px; font-weight: bold; color: #0f172a; margin-top: 4px;">${submission.title}</div>
          </div>
          ${notes ? `
          <div style="background: #fffbeb; border-left: 4px solid #d97706; padding: 14px 16px; margin: 18px 0; border-radius: 4px;">
            <strong style="color: #b45309; display: block; font-size: 13px; text-transform: uppercase; letter-spacing: 0.03em;">Reviewer & Committee Feedback / Required Changes:</strong>
            <p style="margin: 8px 0 0 0; color: #334155; font-size: 14px; white-space: pre-wrap; line-height: 1.5;">${notes}</p>
          </div>` : ''}
          <p style="font-size: 14px; line-height: 1.5;">Please revise your manuscript/abstract addressing the feedback above and submit your updated version within <strong>14 days</strong> using the button below:</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${link}" style="background: #6C4AB6; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Submit Revised Abstract
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">If the button does not work, visit: <a href="${link}" style="color: #6C4AB6;">${link}</a></p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Scientific Committee Secretariat • Global Healthcare Conclave 2026</p>
        </div>
      `;
      const revisionPoints = buildRevisionPointVariables(notes);
      await sendTemplateEmail('abstract_revision_required', authorEmail, {
        fullName: submission.presentingAuthor || submission.authors || 'Author',
        name: submission.presentingAuthor || submission.authors || 'Author',
        abstractTitle: submission.title,
        abstract_title: submission.title,
        title: submission.title,
        abstractCode: submission.abstractId || `GHC-ABS-${String(submission.id).padStart(5, '0')}`,
        category: submission.category || '',
        revisionInstructions: notes,
        ...revisionPoints,
        revisionLink: link,
        revision_link: link,
        link,
        whatsappGroupLink: getAbstractWhatsappGroupUrl(),
        expiresAt: expires.toLocaleDateString('en-IN', { dateStyle: 'medium' }),
        contactEmail: getRevisionContact(),
      });
      emailSent = true;
      await Research.markRevisionEmailStatus(submission.id, 'sent');
      await logDecision(req, 'revision_email_sent', submission.id, { email: authorEmail });
    } catch (mailErr) {
      console.error('Failed to send revision email:', mailErr.message);
      await Research.markRevisionEmailStatus(submission.id, 'failed').catch(() => {});
      await logDecision(req, 'revision_email_failed', submission.id, { email: authorEmail, error: mailErr.message });
    }
  }
  
  await logDecision(req, 'requested_revision', submission.id, { email: authorEmail, emailSent, notes });
  res.json({ success: true, link, emailSent, recipient: authorEmail, expiresAt: expires });
});

const resendRevisionEmail = asyncHandler(async (req, res) => {
  const submission = await Research.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  if (submission.status !== 'revision_requested') {
    return res.status(409).json({ message: 'This abstract is no longer awaiting revision.' });
  }
  if (!submission.email) {
    return res.status(400).json({ message: 'This abstract does not have an applicant email address.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + Number(process.env.REVISION_TOKEN_TTL_DAYS || 7) * 24 * 60 * 60 * 1000);
  const notes = req.body?.notes || req.body?.comments || submission.reviewNotes || '';
  const link = `${getPublicAppUrl()}/abstract/revise/${token}`;

  await Research.requestRevision(submission.id, token, expires, {
    applicantEmail: submission.email,
    abstractVersion: submission.currentVersion || 1,
    createdBy: req.user?.id || null,
    comments: notes,
  });

  try {
    const revisionPoints = buildRevisionPointVariables(notes);
    await sendTemplateEmail('abstract_revision_required', submission.email, {
      fullName: submission.presentingAuthor || submission.authors || 'Author',
      name: submission.presentingAuthor || submission.authors || 'Author',
      abstractTitle: submission.title,
      abstract_title: submission.title,
      title: submission.title,
      abstractCode: submission.abstractId || `GHC-ABS-${String(submission.id).padStart(5, '0')}`,
      category: submission.category || '',
      revisionInstructions: notes,
      ...revisionPoints,
      revisionLink: link,
      revision_link: link,
      link,
      whatsappGroupLink: getAbstractWhatsappGroupUrl(),
      expiresAt: expires.toLocaleDateString('en-IN', { dateStyle: 'medium' }),
      contactEmail: getRevisionContact(),
    });
    await Research.markRevisionEmailStatus(submission.id, 'sent');
    await logDecision(req, 'revision_email_resent', submission.id, { email: submission.email, expiresAt: expires });
    res.json({ success: true, link, emailSent: true, recipient: submission.email, expiresAt: expires });
  } catch (mailErr) {
    await Research.markRevisionEmailStatus(submission.id, 'failed').catch(() => {});
    await logDecision(req, 'revision_email_failed', submission.id, { email: submission.email, error: mailErr.message, resend: true });
    res.status(502).json({ success: false, link, emailSent: false, message: 'Revision link was generated, but email delivery failed.' });
  }
});

const validateRevisionToken = asyncHandler(async (req, res) => {
  const tokenRecord = await Research.findRevisionToken(req.params.token);
  const tokenError = mapRevisionTokenError(tokenRecord);
  if (tokenError) {
    return res.status(tokenError.status).json({ message: tokenError.message, code: tokenError.code, contactEmail: getRevisionContact() });
  }
  const submission = await Research.findByToken(req.params.token);
  if (!submission) return res.status(404).json({ message: 'Invalid revision link.', code: 'invalid' });
  await logDecision(req, 'revision_page_accessed', submission.id, { tokenId: submission.revisionTokenId });
  res.json({ submission: publicRevisionPayload(submission) });
});

const submitRevision = asyncHandler(async (req, res) => {
  const tokenRecord = await Research.findRevisionToken(req.params.token);
  const tokenError = mapRevisionTokenError(tokenRecord);
  if (tokenError) {
    return res.status(tokenError.status).json({ message: tokenError.message, code: tokenError.code, contactEmail: getRevisionContact() });
  }
  const submission = await Research.findByToken(req.params.token);
  if (!submission) return res.status(404).json({ message: 'Invalid revision link.', code: 'invalid' });
  
  if (!req.files?.pdf) return res.status(400).json({ message: 'Abstract PDF is required' });
  
  const driveUpload = await uploadResearchPdf({
    file: req.files?.pdf?.[0],
    category: submission.category,
    title: submission.title,
    suffix: `v${(submission.currentVersion || 1) + 1}`
  });
  
  const pdfCloudinaryUrl = await uploadFileHelper(req.files?.pdf?.[0]);
  const pdfUrl = pdfCloudinaryUrl || driveUpload?.webViewLink || `/uploads/research/${req.files.pdf[0].filename}`;
  
  let declarationUrl = submission.declarationUrl;
  if (req.files?.declaration) {
    const declUpload = await uploadResearchPdf({
      file: req.files?.declaration?.[0],
      category: submission.category,
      title: submission.title,
      suffix: `declaration_v${(submission.currentVersion || 1) + 1}`
    });
    const declCloudinaryUrl = await uploadFileHelper(req.files?.declaration?.[0]);
    declarationUrl = declCloudinaryUrl || declUpload?.webViewLink || `/uploads/research/${req.files.declaration[0].filename}`;
  }
  
  let newSubmission;
  try {
    newSubmission = await Research.saveRevision(req.params.token, {
      title: req.body.title,
      abstractText: req.body.abstractText || req.body.abstract_text,
      category: req.body.category,
      pdfUrl,
      declarationUrl,
    });
  } catch (error) {
    const statusByCode = {
      INVALID_TOKEN: 404,
      USED_TOKEN: 410,
      EXPIRED_TOKEN: 410,
      NOT_AWAITING_REVISION: 409,
    };
    return res.status(statusByCode[error.code] || 500).json({ message: error.message || 'Something went wrong. Please try again later.' });
  }
  await logDecision(req, 'submitted_revision', submission.id, { newVersion: newSubmission.currentVersion });
  await logDecision(req, 'revision_token_invalidated', submission.id, { newVersion: newSubmission.currentVersion });
  if (newSubmission.email) {
    await sendTemplateEmail('abstract_revision_submitted', newSubmission.email, {
      fullName: newSubmission.presentingAuthor || newSubmission.authors || 'Author',
      name: newSubmission.presentingAuthor || newSubmission.authors || 'Author',
      abstractTitle: newSubmission.title,
      title: newSubmission.title,
      abstractCode: newSubmission.abstractId || `GHC-ABS-${String(newSubmission.id).padStart(5, '0')}`,
      versionNumber: newSubmission.currentVersion,
      contactEmail: getRevisionContact(),
    }).catch((mailErr) => logDecision(req, 'revision_submitted_email_failed', submission.id, { error: mailErr.message }));
  }
  
  res.json({ success: true, submission: newSubmission });
});

const publicParticipationPayload = (tokenRecord) => ({
  abstractCode: tokenRecord.abstract_code,
  title: tokenRecord.title,
  applicantName: tokenRecord.presenting_author || tokenRecord.authors || 'Author',
  institution: tokenRecord.institution || '',
  status: tokenRecord.status,
  confirmedAt: tokenRecord.confirmed_at,
  expiresAt: tokenRecord.expires_at,
});

const validateParticipationToken = asyncHandler(async (req, res) => {
  const tokenRecord = await Research.findParticipationToken(req.params.token);
  if (!tokenRecord) {
    return res.status(404).json({ message: 'Invalid participation confirmation link.', code: 'invalid' });
  }
  if (tokenRecord.confirmed_at || tokenRecord.status === 'confirmed') {
    return res.json({ valid: true, alreadyConfirmed: true, submission: publicParticipationPayload(tokenRecord) });
  }
  if (tokenRecord.status !== 'active' || new Date(tokenRecord.expires_at) <= new Date()) {
    return res.status(410).json({ message: 'This participation confirmation link has expired.', code: 'expired' });
  }
  return res.json({ valid: true, alreadyConfirmed: false, submission: publicParticipationPayload(tokenRecord) });
});

const confirmParticipation = asyncHandler(async (req, res) => {
  try {
    const result = await Research.confirmParticipation(req.params.token);
    await logDecision(req, result.alreadyConfirmed ? 'participation_already_confirmed' : 'participation_confirmed', result.submission.abstract_id, {
      abstractCode: result.submission.abstract_code,
    });
    return res.json({
      success: true,
      alreadyConfirmed: result.alreadyConfirmed,
      submission: publicParticipationPayload({
        ...result.submission,
        status: 'confirmed',
        confirmed_at: result.submission.confirmed_at || new Date(),
      }),
    });
  } catch (error) {
    const statusByCode = { INVALID_TOKEN: 404, EXPIRED_TOKEN: 410 };
    return res.status(statusByCode[error.code] || 500).json({ message: error.message || 'Unable to confirm participation.' });
  }
});

module.exports = {
  assignPresentation,
  assignReviewer,
  awardResearch,
  createResearch,
  getSettings,
  getResearch,
  exportAbstractRankingsCsv,
  assignedReviews,
  listAbstractRankings,
  listAwards: listRows('awards', 'awards', 'name ASC'),
  listAwardResults: listRows('award_results', 'results', 'score DESC'),
  listCategories: listRows('abstract_categories', 'categories', 'name ASC'),
  listCriteria: listRows('scoring_criteria', 'criteria', 'id ASC'),
  listJudges: listRows('judges', 'judges', 'id DESC'),
  listPresentationAssignments: listRows('presentation_assignments', 'assignments', 'presentation_order ASC'),
  listPresentationSessions: listRows('presentation_sessions', 'sessions', 'date ASC, start_time ASC'),
  listResearch,
  listReviewers,
  listReviews,
  removeReviewerAssignment,
  researchStats,
  reviewResearch,
  saveAward,
  saveAwardResult,
  saveCategory,
  saveCriteria,
  saveJudge,
  savePresentationSession,
  saveReviewer,
  saveSettings,
  scientificReports,
  submitScore,
  statusResearch,
  submitResearch,
  updateResearch,
  updateIntegrity,
  exportResearchCSV,
  emailParticipants,
  requestRevision,
  resendRevisionEmail,
  revisionRateLimiter,
  validateRevisionToken,
  submitRevision,
  validateParticipationToken,
  confirmParticipation,
  suspendReviewer,
  applyReinstatement,
  reinstateReviewer,
  getMyReviewerProfile,
};
