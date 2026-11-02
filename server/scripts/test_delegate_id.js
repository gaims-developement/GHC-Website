// Self-check for photo ID validation, encryption and the venue Word list. Run: node scripts/test_delegate_id.js
require('dotenv').config({ quiet: true });
const assert = require('assert');
const crypto = require('crypto');

process.env.ID_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
const { decryptIdNumber, encryptIdNumber } = require('../utils/idEncryption');
const { canUploadId, parseIdSubmission, toReviewerRow } = require('../controllers/delegateIdController');
const { rolePermissionMap } = require('../config/schema');
const delegateRoutes = require('../routes/delegateRoutes');
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
assert.strictEqual(canUploadId({ id_status: 'verified', id_type: 'college_id', submitted_at: before }), false, 'a verified College ID stays locked without the mail');
assert.strictEqual(canUploadId({ id_status: 'verified', id_type: 'college_id', submitted_at: before, college_id_update_sent_at: after }), true, 'the mail also opens an ID wrongly labelled College ID');
assert.strictEqual(canUploadId({ id_status: 'verified', id_type: 'college_id', submitted_at: after, college_id_update_sent_at: before }), false, 'locked again after that re-upload');

const stored = encryptIdNumber('ABCDE1234F');
assert.ok(!stored.includes('ABCDE1234F'));
assert.notStrictEqual(stored, encryptIdNumber('ABCDE1234F'), 'same number encrypts differently each time');
assert.strictEqual(decryptIdNumber(stored), 'ABCDE1234F');
const parts = stored.split('.');
parts[2] = Buffer.from('tampered').toString('base64');
assert.throws(() => decryptIdNumber(parts.join('.')), 'tampered values are rejected');

// Runs a route's guards (not its handler) as this user; true means the request would reach the handler.
const isAllowed = async (method, path, user) => {
  const { route } = delegateRoutes.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]);
  for (const { handle } of route.stack.slice(0, -1).filter(({ handle }) => handle.name !== 'requireAuth')) {
    const passed = await new Promise((resolve) => handle({ user }, { status: () => ({ json: () => resolve(false) }) }, () => resolve(true)));
    if (!passed) return false;
  }
  return true;
};

(async () => {
  const { matchDelegateNames } = await import('../../client/src/admin/utils/matchDelegateNames.js');
  const submitted = { idTypeLabel: 'PAN Card', nameOnId: '' };
  const people = [
    { id: 1, fullName: 'Nandita Dash', email: 'n@x.co', submission: submitted },
    { id: 2, fullName: 'Dr. K.B. Yuktha', email: 'k@x.co', submission: submitted },
    { id: 3, fullName: 'Anmol Singh', email: 'a1@x.co', submission: submitted },
    { id: 4, fullName: 'Anmol  Singh', email: 'a2@x.co', submission: submitted },
    { id: 5, fullName: 'Drishti Rao', email: 'd@x.co', submission: { ...submitted, nameOnId: 'Drishti M Rao' } },
    { id: 6, fullName: 'Rishab R', email: 'r@x.co', submission: null },
    { id: 7, fullName: 'Zoya Akram', email: '', submission: submitted },
    { id: 8, fullName: 'Soumya Mahajan', email: 's@x.co', submission: submitted, collegeIdUpdateSentAt: '2026-11-02' },
  ];
  const match = (name) => matchDelegateNames(name, people)[0];
  assert.strictEqual(match('Ms.Nandita Dash').delegate.id, 1, 'a title with no space');
  assert.strictEqual(match('Dr KB Yuktha\tignored').delegate.id, 2, 'punctuation, and a pasted spreadsheet row');
  assert.strictEqual(match('Mr. Drishti M Rao').delegate.id, 5, 'the name on their ID also matches');
  assert.strictEqual(match('Drishti').problem, 'Not found', 'part of a name is not a match');
  assert.strictEqual(match('Rao Drishti').problem, 'Not found', 'nothing is guessed');
  assert.match(match('Mr. Anmol Singh').problem, /2 delegates/, 'an unclear name is not sent');
  assert.strictEqual(match('Mr. Rishab R').problem, 'Has not submitted an ID');
  assert.strictEqual(match('Dr. Zoya Akram').problem, 'No email address');
  assert.strictEqual(match('Mr. Soumya Mahajan').problem, 'Already sent this mail', 'running a list twice mails nobody twice');
  const twice = matchDelegateNames('Nandita Dash\n\nMs. Nandita Dash\n', people);
  assert.deepStrictEqual(twice.map((m) => m.problem), [null, 'Listed twice'], 'one mail per person, blank lines ignored');
  assert.strictEqual(match('Dr.').problem, 'Not found', 'a bare title matches nobody');

  const verifier = { role: 'PHOTO_ID_VERIFIER', permissions: [] };
  assert.deepStrictEqual(rolePermissionMap.PHOTO_ID_VERIFIER, ['delegate_id.verify'], 'the role stays this narrow');
  for (const [method, path] of [['get', '/ids'], ['patch', '/:id/id-status'], ['get', '/:id/id-document']]) {
    assert.strictEqual(await isAllowed(method, path, verifier), true, `verifier can ${method} ${path}`);
    assert.strictEqual(await isAllowed(method, path, { role: 'ADMIN', permissions: [] }), true, `admin can still ${method} ${path}`);
  }
  for (const [method, path] of [['get', '/'], ['get', '/ids/export'], ['post', '/:id/send-id-request'], ['post', '/import'], ['patch', '/:id/attendance'], ['post', '/check-in']]) {
    assert.strictEqual(await isAllowed(method, path, verifier), false, `verifier cannot ${method} ${path}`);
  }
  assert.strictEqual(await isAllowed('get', '/ids', { role: 'CHECKIN', permissions: [] }), false, 'door staff cannot list IDs');

  const reviewerRow = toReviewerRow({ id: 1, registration_id: 'R1', full_name: 'A', email: 'a@b.c', phone: '999', id_request_last_error: 'x', id_status: 'pending', id_type: 'college_id', name_on_id: 'A', id_phone: '888', id_number_enc: encryptIdNumber('GMC118') });
  assert.ok(!/a@b\.c|999|888/.test(JSON.stringify(reviewerRow)), 'no contact details reach a reviewer');
  assert.strictEqual(reviewerRow.submission.numberLast4, 'C118');

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
