const fs = require('fs/promises');
const cloudinary = require('../config/cloudinary');

const folderMap = {
  speakers: 'ghc/speakers',
  workshops: 'ghc/workshops',
  partners: 'ghc/partners',
  gallery: 'ghc/gallery',
  certificates: 'ghc/certificates',
};

const uploadToCloudinary = async (filePath, folder = 'ghc') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: folderMap[folder] || folder,
    resource_type: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    transformation: [{ width: 1600, crop: 'limit' }],
  });

  await fs.unlink(filePath).catch(() => {});
  return result;
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { deleteFromCloudinary, uploadToCloudinary };
