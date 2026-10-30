// Self-check for reminder import parsing. Run: node scripts/test_reminder_import.js
require('dotenv').config({ quiet: true });
const assert = require('assert');
const { parseImportRows } = require('../controllers/reminderController');

const { list, invalidRows, mergedInFile } = parseImportRows([
  { fullName: 'Khushi Sharma', email: 'Khushi@Example.com', phone: 9876543210, abstractId: 'ghc-abs-00018' },
  { fullName: 'Khushi Sharma', email: 'khushi@example.com', abstractId: 'GHC-ABS-00095' },
  { fullName: 'Khushi Sharma', email: 'khushi@example.com', abstractId: 'GHC-ABS-00095' },
  { fullName: 'Samrat Mukherjee', email: 'first@example.com', phone: '+91 93150 46546', abstractId: 'GHC-ABS-00021' },
  { fullName: 'Samrat Mukherjee', email: 'second@example.com', phone: '9315046546', abstractId: 'GHC-ABS-00082' },
  { fullName: 'No Phone One', email: 'one@example.com', abstractId: 'GHC-ABS-00002' },
  { fullName: 'No Phone Two', email: 'two@example.com', abstractId: 'GHC-ABS-00003' },
  { fullName: 'No Email', email: '', abstractId: 'GHC-ABS-00001' },
  { fullName: 'Bad Email', email: 'not-an-email', abstractId: 'GHC-ABS-00001' },
  { fullName: 'No Abstract', email: 'none@example.com', abstractId: '' },
  { fullName: 'Wrong Abstract', email: 'wrong@example.com', abstractId: '88' },
]);

assert.strictEqual(list.length, 4, 'same email or phone merges; different people stay separate, even with no phone');
assert.strictEqual(list[1].email, 'first@example.com', 'the first email is kept');
assert.deepStrictEqual(list[1].codes, ['GHC-ABS-00021', 'GHC-ABS-00082'], 'same phone with a different email merges');
assert.deepStrictEqual(list[0].codes, ['GHC-ABS-00018', 'GHC-ABS-00095'], 'codes are upper-cased and de-duplicated');
assert.strictEqual(list[0].key, 'khushi@example.com');
assert.strictEqual(list[0].phone, '9876543210', 'numeric Excel phone cells become text');
assert.strictEqual(mergedInFile, 3);
assert.deepStrictEqual(invalidRows, [8, 9, 10, 11]);
console.log('reminder import ok');
process.exit(0);
