const crypto = require('crypto');

const INSECURE_SECRETS = ['change-this-secret', 'secret', 'changeme'];

const getJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '').trim();
  if (!secret || INSECURE_SECRETS.includes(secret)) {
    throw new Error('JWT_SECRET must be set to a long random value (server/.env locally, service variables in production)');
  }
  return secret;
};

const getRefreshSecret = () => String(process.env.JWT_REFRESH_SECRET || '').trim() || getJwtSecret();

// Called at startup so a missing secret stops the server instead of failing per request.
const assertJwtConfig = () => {
  const secret = getJwtSecret();
  if (secret.length < 32) {
    console.warn('JWT_SECRET is shorter than 32 characters; use a longer random value.');
  }
};

// Short signature for links that must open without a login (e.g. a delegate's own invoice).
const signResource = (...parts) =>
  crypto.createHmac('sha256', getJwtSecret()).update(parts.join(':')).digest('hex').slice(0, 32);

const verifyResourceSignature = (signature, ...parts) => {
  const expected = Buffer.from(signResource(...parts));
  const actual = Buffer.from(String(signature || ''));
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
};

module.exports = { assertJwtConfig, getJwtSecret, getRefreshSecret, signResource, verifyResourceSignature };
