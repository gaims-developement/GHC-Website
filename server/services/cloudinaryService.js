const fs = require('fs/promises');
const cloudinary = require('../config/cloudinary');

const folderMap = {
  speakers: 'ghc/speakers',
  workshops: 'ghc/workshops',
  partners: 'ghc/partners',
  gallery: 'ghc/gallery',
  certificates: 'ghc/certificates',
  forms: 'ghc/forms',
  trailer: 'ghc/trailer',
};

const uploadToCloudinary = async (filePath, folder = 'ghc', options = {}) => {
  const uploadOptions = {
    folder: folderMap[folder] || folder,
    resource_type: options.resourceType || 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  };

  if (options.transform !== false) {
    uploadOptions.transformation = [{ width: 1600, crop: 'limit' }];
  }

  const result = await cloudinary.uploader.upload(filePath, uploadOptions);

  await fs.unlink(filePath).catch(() => {});
  return result;
};

const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { deleteFromCloudinary, uploadToCloudinary };
