const path = require('path');

// The mimetype is sent by the client, so the stored extension is what decides how a file is served.
const hasAllowedExtension = (file, extensions) =>
  extensions.includes(path.extname(String(file?.originalname || '')).toLowerCase());

const INLINE_SAFE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.pdf', '.mp4', '.webm', '.mov'];

// Anything a browser could execute (HTML, SVG, JS) is forced to download and sandboxed.
const setUploadHeaders = (res, filePath) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!INLINE_SAFE_EXTENSIONS.includes(path.extname(filePath).toLowerCase())) {
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  }
};

module.exports = { hasAllowedExtension, setUploadHeaders };
