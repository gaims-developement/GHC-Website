// Self-check for photo ID validation, encryption and the venue Word list. Run: node scripts/test_delegate_id.js
require('dotenv').config({ quiet: true });
const assert = require('assert');
const crypto = require('crypto');

process.env.ID_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
const { decryptIdNumber, encryptIdNumber } = require('../utils/idEncryption');
const { canUploadId, parseIdSubmission } = require('../controllers/delegateIdController');
const { buildVenueListDoc, shrinkIdImage } = require('../services/venueListDocService');

const valid = { nameOnId: 'Khushi  Sharma', idType: 'college_id', idNumber: 'gmc/2024 118', phone: '+91 98765-43210', consent: 'true' };
assert.deepStrictEqual(parseIdSubmission(valid).value, { nameOnId: 'Khushi Sharma', idType: 'college_id', idNumber: 'GMC/2024118', phone: '+919876543210' });
assert.ok(parseIdSubmission({ ...valid, consent: 'false' }).error, 'consent is required');
['pan', 'passport', 'aadhaar_masked', 'constructor'].forEach((idType) => assert.ok(parseIdSubmission({ ...valid, idType }).error, `${idType} is refused`));
assert.ok(parseIdSubmission({ ...valid, phone: '9.18E+11' }).error, 'corrupted phones are refused');
assert.ok(parseIdSubmission({ ...valid, idNumber: 'A!' }).error, 'number must fit the type');

const before = new Date('2026-11-01T10:00:00Z');
const after = new Date('2026-11-02T10:00:00Z');
assert.strictEqual(canUploadId({}), true, 'first upload is allowed');
assert.strictEqual(canUploadId({ id_status: 'rejected', id_type: 'pan', submitted_at: after }), true, 'a rejected ID can be redone');
assert.strictEqual(canUploadId({ id_status: 'pending', id_type: 'pan', submitted_at: before }), false, 'locked when no update mail was sent');
assert.strictEqual(canUploadId({ id_status: 'pending', id_type: 'pan', submitted_at: before, college_id_update_sent_at: after }), true, 'the mail opens one re-upload');
assert.strictEqual(canUploadId({ id_status: 'verified', id_type: 'pan', submitted_at: before, college_id_update_sent_at: after }), true, 'a verified government ID can be replaced after the mail');
assert.strictEqual(canUploadId({ id_status: 'pending', id_type: 'college_id', submitted_at: after, college_id_update_sent_at: before }), false, 'locked after the re-upload');
assert.strictEqual(canUploadId({ id_status: 'verified', id_type: 'college_id', submitted_at: before, college_id_update_sent_at: after }), false, 'a verified College ID stays locked');

const stored = encryptIdNumber('ABCDE1234F');
assert.ok(!stored.includes('ABCDE1234F'));
assert.notStrictEqual(stored, encryptIdNumber('ABCDE1234F'), 'same number encrypts differently each time');
assert.strictEqual(decryptIdNumber(stored), 'ABCDE1234F');
const parts = stored.split('.');
parts[2] = Buffer.from('tampered').toString('base64');
assert.throws(() => decryptIdNumber(parts.join('.')), 'tampered values are rejected');

(async () => {
  const { createCanvas } = require('@napi-rs/canvas');
  const big = createCanvas(1600, 1000).toBuffer('image/png');
  const photo = await shrinkIdImage(big);
  assert.deepStrictEqual([photo.width, photo.height], [700, 438], 'images are shrunk, keeping their shape');
  assert.strictEqual((await shrinkIdImage(createCanvas(300, 200).toBuffer('image/png'))).width, 300, 'small images are not enlarged');

  const delegate = { name: 'A & <B>', email: 'one@example.com', phone: '+919876543210', idType: 'Passport', idNumber: 'Z1234567', photo };
  const doc = await buildVenueListDoc([delegate, { ...delegate, photo: null }]);
  assert.strictEqual(doc.subarray(0, 2).toString(), 'PK', 'a .docx is a zip file');
  assert.ok(doc.length > (await buildVenueListDoc([{ ...delegate, photo: null }])).length, 'images are embedded');
  console.log('delegate id ok');
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
