const assert = require('assert');

// Each author's revision deadline depends on when they submitted. All times are end of day IST.
const FIRST_BATCH_CUTOFF = new Date('2026-10-22T23:59:59+05:30');
const FIRST_BATCH_DEADLINE = new Date('2026-11-05T23:59:59+05:30');
const FINAL_DEADLINE = new Date('2026-11-14T23:59:59+05:30');

// A first-batch abstract sent for revision after its own deadline has passed gets the final deadline, so its link still works.
const getRevisionDeadline = (submittedAt, now = new Date()) => {
  const firstBatch = new Date(submittedAt) <= FIRST_BATCH_CUTOFF;
  return firstBatch && now <= FIRST_BATCH_DEADLINE ? FIRST_BATCH_DEADLINE : FINAL_DEADLINE;
};

const formatRevisionDeadline = (date) => date.toLocaleDateString('en-IN', { dateStyle: 'long', timeZone: 'Asia/Kolkata' });

if (require.main === module) {
  const now = new Date('2026-10-31T12:00:00+05:30');
  assert.strictEqual(getRevisionDeadline('2026-10-10T10:00:00+05:30', now), FIRST_BATCH_DEADLINE);
  assert.strictEqual(getRevisionDeadline('2026-10-22T23:00:00+05:30', now), FIRST_BATCH_DEADLINE, 'all of 22 Oct IST is first batch');
  assert.strictEqual(getRevisionDeadline('2026-10-23T00:30:00+05:30', now), FINAL_DEADLINE, 'just after midnight IST, still 22 Oct UTC');
  assert.strictEqual(getRevisionDeadline('2026-10-10T10:00:00+05:30', new Date('2026-11-06T09:00:00+05:30')), FINAL_DEADLINE, 'first-batch deadline already passed');
  assert.strictEqual(formatRevisionDeadline(FIRST_BATCH_DEADLINE), '5 November 2026');
  assert.strictEqual(formatRevisionDeadline(FINAL_DEADLINE), '14 November 2026');
  console.log('revision deadline ok');
}

module.exports = { formatRevisionDeadline, getRevisionDeadline };
