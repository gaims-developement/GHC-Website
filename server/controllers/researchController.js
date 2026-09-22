const Research = require('../models/researchModel');
const { pool } = require('../config/db');
const ActivityLog = require('../models/activityLogModel');
const { uploadResearchPdf } = require('../services/googleDriveService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { sendTemplateEmail } = require('../services/mailService');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

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
const reviewRoles = ['SUPER_ADMIN', 'ADMIN', 'RESEARCH'];

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
  const isSuperOrAdmin = reviewRoles.includes(req.user?.role) || req.user?.permissions?.includes('manage_abstracts');
  const includeAll = req.query.admin === '1' && isSuperOrAdmin;
  const isReviewer = !isSuperOrAdmin && req.user?.permissions?.includes('review_abstracts');
  const reviewerId = isReviewer ? req.user.id : null;

  const submissions = await Research.list({ includeAll, reviewerId });
  res.json({ submissions });
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
  return res.json({ submission });
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
  return res.json({ submission });
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
      COUNT(DISTINCT ar.id) AS completed_reviews
    FROM reviewers r
    INNER JOIN users u ON u.id = r.user_id
    LEFT JOIN abstract_review_assignments ara ON ara.reviewer_id = r.id
    LEFT JOIN abstract_reviews ar ON ar.reviewer_id = r.id
    GROUP BY r.id
    ORDER BY u.name ASC
  `);
  res.json({ reviewers });
});

const saveReviewer = asyncHandler(async (req, res) => {
  const payload = [req.body.userId || req.body.user_id, req.body.specialization || null, req.body.designation || null, req.body.institution || null, req.body.country || null];
  let id = req.params.id;
  if (id) await pool.query('UPDATE reviewers SET user_id=?, specialization=?, designation=?, institution=?, country=? WHERE id=?', [...payload, id]);
  else {
    const [result] = await pool.query('INSERT INTO reviewers (user_id, specialization, designation, institution, country) VALUES (?, ?, ?, ?, ?)', payload);
    id = result.insertId;
  }
  await logDecision(req, req.params.id ? 'updated_reviewer' : 'created_reviewer', id);
  res.json({ id });
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
  if (!reviewer && req.user?.role !== 'SUPER_ADMIN') return res.json({ assignments: [] });
  const params = reviewer ? [reviewer.id] : [];
  const where = reviewer ? 'WHERE ara.reviewer_id = ?' : '';
  const [assignments] = await pool.query(`
    SELECT ara.*, a.abstract_id AS abstractCode, a.title, a.category, a.keywords, a.abstract_text, a.file_url, a.status, a.submission_status
    FROM abstract_review_assignments ara
    INNER JOIN abstracts a ON a.id = ara.abstract_id
    ${where}
    ORDER BY ara.assigned_at DESC
  `, params);
  res.json({ assignments });
});

const submitScore = asyncHandler(async (req, res) => {
  const reviewer = await getReviewerForUser(req.user?.id);
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
    SELECT ar.*, a.title, a.abstract_id AS abstractCode, u.name AS reviewer_name
    FROM abstract_reviews ar
    INNER JOIN abstracts a ON a.id = ar.abstract_id
    INNER JOIN reviewers r ON r.id = ar.reviewer_id
    INNER JOIN users u ON u.id = r.user_id
    ${where}
    ORDER BY ar.reviewed_at DESC
  `, reviewer ? [reviewer.id] : []);
  res.json({ reviews });
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
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
  
  await Research.requestRevision(req.params.id, token, expires);
  
  const link = `${process.env.CLIENT_URL || 'http://localhost:3000'}/abstract-revision/${token}`;
  
  await sendTemplateEmail('abstract_revision', submission.email, {
    title: submission.title,
    link,
  });
  
  await logDecision(req, 'requested_revision', req.params.id);
  res.json({ success: true, token });
});

const validateRevisionToken = asyncHandler(async (req, res) => {
  const submission = await Research.findByToken(req.params.token);
  if (!submission) return res.status(404).json({ message: 'Invalid or expired revision token' });
  res.json({ submission });
});

const submitRevision = asyncHandler(async (req, res) => {
  const submission = await Research.findByToken(req.params.token);
  if (!submission) return res.status(404).json({ message: 'Invalid or expired revision token' });
  
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
  
  const newSubmission = await Research.saveRevision(submission.id, (submission.currentVersion || 1) + 1, pdfUrl, declarationUrl);
  await logDecision(req, 'submitted_revision', submission.id);
  
  res.json({ success: true, submission: newSubmission });
});

module.exports = {
  assignPresentation,
  assignReviewer,
  awardResearch,
  createResearch,
  getSettings,
  getResearch,
  assignedReviews,
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
  validateRevisionToken,
  submitRevision,
};
