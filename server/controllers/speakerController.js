const Speaker = require('../models/speakerModel');
const asyncHandler = require('../utils/asyncHandler');

const validStatuses = ['draft', 'published'];

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const sanitizePayload = (body, file) => ({
  name: body.name?.trim(),
  designation: body.designation?.trim(),
  institution: body.institution?.trim(),
  bio: body.bio?.trim(),
  topic: body.topic?.trim(),
  photoUrl: file ? `/uploads/speakers/${file.filename}` : body.photoUrl || body.photo_url,
  linkedinUrl: body.linkedinUrl || body.linkedin_url,
  instagramUrl: body.instagramUrl || body.instagram_url,
  featured: toBoolean(body.featured),
  keynote: toBoolean(body.keynote),
  displayOrder: body.displayOrder ?? body.display_order ?? 0,
  status: body.status || 'draft',
});

const validate = (payload) => {
  if (!payload.name) return 'Name is required';
  if (!validStatuses.includes(payload.status)) return 'Invalid status';
  return null;
};

const listSpeakers = asyncHandler(async (req, res) => {
  const includeDrafts = req.query.admin === '1' && ['SUPER_ADMIN', 'ADMIN', 'MEDIA'].includes(req.user?.role);
  const speakers = await Speaker.list({ includeDrafts });
  res.json({ speakers });
});

const getSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.findById(req.params.id);
  if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
  return res.json({ speaker });
});

const createSpeaker = asyncHandler(async (req, res) => {
  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const speaker = await Speaker.create(payload);
  return res.status(201).json({ speaker });
});

const updateSpeaker = asyncHandler(async (req, res) => {
  const existing = await Speaker.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Speaker not found' });

  const payload = sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const speaker = await Speaker.update(req.params.id, payload);
  return res.json({ speaker });
});

const deleteSpeaker = asyncHandler(async (req, res) => {
  const deleted = await Speaker.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Speaker not found' });
  return res.json({ success: true });
});

const publishSpeaker = asyncHandler(async (req, res) => {
  const speaker = await Speaker.publish(req.params.id);
  if (!speaker) return res.status(404).json({ message: 'Speaker not found' });
  return res.json({ speaker });
});

const reorderSpeakers = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.items)) {
    return res.status(400).json({ message: 'items array is required' });
  }

  await Speaker.reorder(req.body.items);
  return res.json({ success: true });
});

const speakerStats = asyncHandler(async (_req, res) => {
  const stats = await Speaker.stats();
  return res.json({ stats });
});

module.exports = {
  createSpeaker,
  deleteSpeaker,
  getSpeaker,
  listSpeakers,
  publishSpeaker,
  reorderSpeakers,
  speakerStats,
  updateSpeaker,
};
