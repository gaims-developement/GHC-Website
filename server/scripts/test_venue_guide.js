// Self-check for the Venue page starting content: run with node server/scripts/test_venue_guide.js
const assert = require('assert');
const { stays, cafes, guideItems } = require('../data/venueGuideSeed');
const { rolePermissionMap } = require('../config/schema');

const inSection = (section) => guideItems.filter((item) => item.section === section);
const groups = inSection('stay_group').map((group) => group.title);

assert.strictEqual(stays.length, 25, 'every stay from the guide');
assert.strictEqual(groups.length, 7, 'every stay group');
stays.forEach((stay) => {
  assert.ok(groups.includes(stay.category), `${stay.name} belongs to a real group, or it would fall out of its heading`);
  assert.ok(stay.name && stay.address && stay.price && stay.googleMapsLink && stay.bookingLink, stay.name);
});
assert.strictEqual(cafes.length, 16, 'food list');
assert.strictEqual(inSection('bharat_route').length, 6, 'Bharat Mandapam routes');
assert.strictEqual(inSection('safdarjung_route').length, 7, 'Safdarjung routes');
assert.strictEqual(inSection('bharat_info').length, 1);
assert.strictEqual(inSection('safdarjung_info').length, 1);
assert.strictEqual(inSection('checklist').length, 10, 'travel checklist');
guideItems.forEach((item) => assert.ok(item.title && item.title.length <= 255 && (item.subtitle || '').length <= 255, item.title));
assert.deepStrictEqual(rolePermissionMap.HOSPITALITY_MANAGER, ['hospitality.manage'], 'the role stays this narrow');
assert.ok(rolePermissionMap.SUPER_ADMIN.includes('hospitality.manage'));
console.log('venue guide ok');
