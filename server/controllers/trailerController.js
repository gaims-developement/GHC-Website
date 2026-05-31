const { deleteFromCloudinary, uploadToCloudinary } = require('../services/cloudinaryService');
const Trailer = require('../models/trailerModel');
const asyncHandler = require('../utils/asyncHandler');

const validateUrl = (value) => !value || /^https?:\/\//i.test(value);

const sanitize = (body = {}) => ({
  title: body.title?.trim() || Trailer.defaultTrailer.title,
  description: body.description?.trim() || Trailer.defaultTrailer.description,
  videoUrl: body.videoUrl?.trim() || body.video_url?.trim() || '',
  cloudinaryPublicId: body.cloudinaryPublicId?.trim() || body.cloudinary_public_id?.trim() || '',
  thumbnailUrl: body.thumbnailUrl?.trim() || body.thumbnail_url?.trim() || '',
});

const getTrailer = asyncHandler(async (_req, res) => {
  const result = await Trailer.get();
  return res.json(result);
});

const updateTrailer = asyncHandler(async (req, res) => {
  const payload = sanitize(req.body);
  if (!payload.title) return res.status(400).json({ message: 'Trailer title is required' });
  if (!validateUrl(payload.videoUrl)) return res.status(400).json({ message: 'Trailer video URL must start with http:// or https://' });
  if (!validateUrl(payload.thumbnailUrl)) return res.status(400).json({ message: 'Trailer thumbnail URL must start with http:// or https://' });

  const result = await Trailer.update(payload);
  return res.json(result);
});

const uploadTrailer = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Trailer video file is required' });

  const current = await Trailer.get();
  const result = await uploadToCloudinary(req.file.path, 'trailer', { resourceType: 'video', transform: false });

  if (current.trailer.cloudinaryPublicId) {
    await deleteFromCloudinary(current.trailer.cloudinaryPublicId, 'video').catch((error) => {
      console.warn(`Cloudinary trailer delete failed: ${error.message}`);
    });
  }

  const next = await Trailer.update({
    title: req.body.title?.trim() || current.trailer.title,
    description: req.body.description?.trim() || current.trailer.description,
    videoUrl: result.secure_url,
    cloudinaryPublicId: result.public_id,
    thumbnailUrl: result.secure_url.replace('/upload/', '/upload/so_0,w_1200,h_675,c_fill,f_jpg,q_auto/').replace(/\.[^.]+$/, '.jpg'),
  });

  return res.status(201).json({ ...next, cloudinaryStatus: 'uploaded' });
});

const removeTrailer = asyncHandler(async (_req, res) => {
  const current = await Trailer.get();
  if (current.trailer.cloudinaryPublicId) {
    await deleteFromCloudinary(current.trailer.cloudinaryPublicId, 'video').catch((error) => {
      console.warn(`Cloudinary trailer delete failed: ${error.message}`);
    });
  }

  const result = await Trailer.save({
    ...Trailer.defaultTrailer,
    title: current.trailer.title,
    description: current.trailer.description,
  });
  return res.json(result);
});

module.exports = { getTrailer, removeTrailer, updateTrailer, uploadTrailer };
