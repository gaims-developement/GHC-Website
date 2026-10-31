// Self-check for photo ID validation, encryption and the venue CSV. Run: node scripts/test_delegate_id.js
require('dotenv').config({ quiet: true });
const assert = require('assert');
const crypto = require('crypto');

process.env.ID_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
const { decryptIdNumber, encryptIdNumber } = require('../utils/idEncryption');
const { buildVenueCsv, parseIdSubmission } = require('../controllers/delegateIdController');

const valid = { nameOnId: 'Khushi  Sharma', idType: 'pan', idNumber: 'abcde 1234f', phone: '+91 98765-43210', consent: 'true' };
assert.deepStrictEqual(parseIdSubmission(valid).value, { nameOnId: 'Khushi Sharma', idType: 'pan', idNumber: 'ABCDE1234F', phone: '+919876543210' });
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

const csv = buildVenueCsv([{
  registration_id: 'GHC26-DEL-00001',
  name_on_id: '=HYPERLINK("http://evil")',
  full_name: 'Delegate "One"',
  id_phone: '+919876543210',
  email: 'one@example.com',
  id_type: 'aadhaar_masked',
  id_number_enc: encryptIdNumber('9012'),
  id_status: 'verified',
}]);
assert.ok(csv.charCodeAt(0) === 0xfeff);
assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`), 'formulas from the public form are neutralised');
assert.ok(csv.includes('"=""+919876543210"""'), 'phones stay exact in Excel');
assert.ok(csv.includes('XXXX XXXX 9012'));
console.log('delegate id ok');
process.exit(0);
