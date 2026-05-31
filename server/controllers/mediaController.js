const Media = require('../models/mediaModel');
const { deleteFromCloudinary, uploadToCloudinary } = require('../services/cloudinaryService');
const asyncHandler = require('../utils/asyncHandler');

const listMedia = asyncHandler(async (req, res) => {
  const assets = await Media.list({
    search: req.query.search || '',
    type: req.query.type || 'all',
  });
  res.json({ assets });
});

const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Media file is required' });

  const result = await uploadToCloudinary(req.file.path, 'gallery');
  const asset = await Media.create({
    filename: result.public_id?.split('/').pop() || req.file.filename,
    originalName: req.file.originalname,
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    fileType: req.file.mimetype,
    sizeBytes: req.file.size,
  });

  return res.status(201).json({ asset });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const asset = await Media.findById(req.params.id);
  if (!asset) return res.status(404).json({ message: 'Media asset not found' });

  await deleteFromCloudinary(asset.publicId, asset.resourceType).catch((error) => {
    console.warn(`Cloudinary media delete failed: ${error.message}`);
  });

  await Media.remove(req.params.id);
  return res.json({ success: true });
});

module.exports = { deleteMedia, listMedia, uploadMedia };
