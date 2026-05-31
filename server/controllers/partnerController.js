const Partner = require('../models/partnerModel');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const cloudinaryConfigured = () =>
  Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_KEY && process.env.CLOUDINARY_SECRET);

const toBoolean = (value) => value === true || value === 'true' || value === '1' || value === 1;

const logoFromFile = async (file) => {
  if (!file) return null;
  if (!cloudinaryConfigured()) return `/uploads/partners/${file.filename}`;

  const result = await uploadToCloudinary(file.path, 'partners');
  return result.secure_url;
};

const sanitizePayload = async (body, file) => ({
  name: body.name?.trim(),
  logo: await logoFromFile(file) || body.logoUrl || body.logo || null,
  website: body.website?.trim(),
  tier: body.tier?.trim(),
  displayOrder: body.displayOrder ?? body.display_order ?? 0,
  active: body.active === undefined ? undefined : toBoolean(body.active),
});

const validate = (payload) => {
  if (!payload.name) return 'Partner name is required';
  if (payload.website && !/^https?:\/\//i.test(payload.website)) return 'Website must start with http:// or https://';
  return null;
};

const listPartners = asyncHandler(async (req, res) => {
  const includeInactive = req.query.admin === '1' && ['SUPER_ADMIN', 'ADMIN', 'MEDIA'].includes(req.user?.role);
  const partners = await Partner.list({ includeInactive });
  res.json({ partners });
});

const createPartner = asyncHandler(async (req, res) => {
  const payload = await sanitizePayload(req.body, req.file);
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const partner = await Partner.create(payload);
  return res.status(201).json({ partner });
});

const updatePartner = asyncHandler(async (req, res) => {
  const existing = await Partner.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Partner not found' });

  const incoming = await sanitizePayload(req.body, req.file);
  const payload = { ...existing };
  Object.entries(incoming).forEach(([key, value]) => {
    if (value !== undefined && value !== null) payload[key] = value;
  });
  const error = validate(payload);
  if (error) return res.status(400).json({ message: error });

  const partner = await Partner.update(req.params.id, payload);
  return res.json({ partner });
});

const deletePartner = asyncHandler(async (req, res) => {
  const deleted = await Partner.remove(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Partner not found' });
  return res.json({ success: true });
});

const reorderPartners = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.items)) return res.status(400).json({ message: 'items array is required' });
  await Partner.reorder(req.body.items);
  return res.json({ success: true });
});

module.exports = {
  createPartner,
  deletePartner,
  listPartners,
  reorderPartners,
  updatePartner,
};
