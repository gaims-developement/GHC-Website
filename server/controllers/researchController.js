const Research = require('../models/researchModel');
const { uploadResearchPdf } = require('../services/googleDriveService');
const asyncHandler = require('../utils/asyncHandler');

const validCategories = ['poster', 'oral'];
const validStatuses = ['draft', 'submitted', 'under_review', 'accepted', 'rejected'];
const reviewRoles = ['SUPER_ADMIN', 'ADMIN', 'RESEARCH'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const sanitizePayload = (body, file) => ({
  title: body.title?.trim(),
  authors: body.authors?.trim(),
  presentingAuthor: body.presentingAuthor || body.presenting_author,
  institution: body.institution?.trim(),
  email: body.email?.trim(),
  phone: body.phone?.trim(),
  category: body.category || 'poster',
  track: body.track?.trim(),
  keywords: body.keywords?.trim(),
  abstractText: body.abstractText || body.abstract_text,
  pdfUrl: file ? `/uploads/research/${file.filename}` : body.pdfUrl || body.pdf_url,
  status: body.status || 'draft',
  awardNomination: toBoolean(body.awardNomination ?? body.award_nomination),
});

const validate = (payload) => {
  if (!payload.title) return 'Title is required';
  if (!validCategories.includes(payload.category)) return 'Invalid category';
  if (!validStatuses.includes(payload.status)) return 'Invalid status';
  return null;
};

const validatePublicSubmission = (payload, file) => {
  if (!payload.presentingAuthor) return 'Personal details are required';
  if (!payload.email) return 'Email is required';
  if (!payload.institution) return 'Institution is required';
  if (!payload.title) return 'Title is required';
  if (!payload.authors) return 'Authors are required';
  if (!payload.abstractText) return 'Abstract is required';
  if (!validCategories.includes(payload.category)) return 'Invalid category';
  if (!file) return 'PDF upload is required';
  return null;
};

const listResearch = asyncHandler(async (req, res) => {
  const includeAll = req.query.admin === '1' && reviewRoles.includes(req.user?.role);
  const submissions = await Research.list({ includeAll });
  res.json({ submissions });
});

const getResearch = asyncHandler(async (req, res) => {
  const submission = await Research.findById(req.params.id);
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ submission });
});

const createResearch = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const submission = await Research.create(payload);
  return res.status(201).json({ submission });
});

const submitResearch = asyncHandler(async (req, res) => {
  const payload = {
    ...sanitizePayload(req.body, req.file),
    status: 'submitted',
  };
  const error = validatePublicSubmission(payload, req.file);
  if (error) return res.status(400).json({ message: error });

  const driveUpload = await uploadResearchPdf({
    file: req.file,
    category: payload.category,
    title: payload.title,
  });

  if (driveUpload?.webViewLink) {
    payload.pdfUrl = driveUpload.webViewLink;
  }

  const submission = await Research.create(payload);
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

  const submission = await Research.update(req.params.id, payload);
  return res.json({ submission });
});

const deleteResearch = asyncHandler(async (req, res) => {
  const deleted = await Research.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ success: true });
});

const reviewResearch = asyncHandler(async (req, res) => {
  const status = req.body.status || 'under_review';
  if (!['under_review', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid review status' });
  }

  const submission = await Research.review(req.params.id, {
    reviewScore: req.body.reviewScore ?? req.body.review_score ?? null,
    reviewNotes: req.body.reviewNotes || req.body.review_notes,
    reviewerId: req.user?.id,
    status,
    awardNomination: toBoolean(req.body.awardNomination ?? req.body.award_nomination),
  });

  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ submission });
});

const statusResearch = asyncHandler(async (req, res) => {
  if (!validStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
  const submission = await Research.setStatus(req.params.id, req.body.status);
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ submission });
});

const awardResearch = asyncHandler(async (req, res) => {
  const submission = await Research.setAward(req.params.id, toBoolean(req.body.awardNomination ?? req.body.award_nomination));
  if (!submission) return res.status(404).json({ message: 'Research submission not found' });
  return res.json({ submission });
});

const researchStats = asyncHandler(async (_req, res) => {
  const stats = await Research.stats();
  return res.json({ stats });
});

module.exports = {
  awardResearch,
  createResearch,
  deleteResearch,
  getResearch,
  listResearch,
  researchStats,
  reviewResearch,
  statusResearch,
  submitResearch,
  updateResearch,
};
