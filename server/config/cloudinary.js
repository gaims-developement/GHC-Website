const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  secure: true,
});

const transformImage = (url, options = {}) => {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  const transforms = [
    `f_${options.format || 'auto'}`,
    `q_${options.quality || 'auto'}`,
    options.width ? `w_${options.width}` : null,
    options.height ? `h_${options.height}` : null,
    options.crop ? `c_${options.crop}` : 'c_limit',
  ].filter(Boolean).join(',');
  return url.replace('/upload/', `/upload/${transforms}/`);
};

module.exports = cloudinary;
module.exports.transformImage = transformImage;
