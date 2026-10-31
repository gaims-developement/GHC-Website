const crypto = require('crypto');

// Government ID numbers are encrypted at rest. ID_ENCRYPTION_KEY is 32 random bytes, base64: losing it makes stored numbers unreadable.
const getKey = () => {
  const key = Buffer.from(process.env.ID_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('ID_ENCRYPTION_KEY must be set to 32 base64-encoded bytes.');
  return key;
};

const encryptIdNumber = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((part) => part.toString('base64')).join('.');
};

const decryptIdNumber = (stored) => {
  const [iv, tag, data] = String(stored).split('.').map((part) => Buffer.from(part, 'base64'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};

module.exports = { decryptIdNumber, encryptIdNumber, getKey };
