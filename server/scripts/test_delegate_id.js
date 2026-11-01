// Self-check for photo ID validation, encryption and the venue Word list. Run: node scripts/test_delegate_id.js
require('dotenv').config({ quiet: true });
const assert = require('assert');
const crypto = require('crypto');

process.env.ID_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
const { decryptIdNumber, encryptIdNumber } = require('../utils/idEncryption');
const { parseIdSubmission } = require('../controllers/delegateIdController');
const { buildVenueListDoc, shrinkIdImage } = require('../services/venueListDocService');

const valid = { nameOnId: 'Khushi  Sharma', idType: 'pan', idNumber: 'abcde 1234f', phone: '+91 98765-43210', consent: 'true' };
assert.deepStrictEqual(parseIdSubmission(valid).value, { nameOnId: 'Khushi Sharma', idType: 'pan', idNumber: 'ABCDE1234F', phone: '+919876543210' });
assert.strictEqual(parseIdSubmission({ ...valid, idType: 'college_id', idNumber: 'gmc/2024-118' }).value.idNumber, 'GMC/2024-118');
assert.ok(parseIdSubmission({ ...valid, consent: 'false' }).error, 'consent is required');
assert.ok(parseIdSubmission({ ...valid, idType: 'constructor' }).error, 'only known ID types');
assert.ok(parseIdSubmission({ ...valid, phone: '9.18E+11' }).error, 'corrupted phones are refused');
assert.ok(parseIdSubmission({ ...valid, idNumber: 'NOTAPAN' }).error, 'number must fit the type');
assert.match(parseIdSubmission({ ...valid, idType: 'aadhaar_masked', idNumber: '1234 5678 9012' }).error, /last 4/, 'full Aadhaar is refused');
assert.strictEqual(parseIdSubmission({ ...valid, idType: 'aadhaar_masked', idNumber: 'XXXX XXXX 9012' }).value.idNumber, '9012');

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
