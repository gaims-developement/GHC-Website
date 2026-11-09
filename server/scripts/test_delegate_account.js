// Self-check for delegate login and the one free workshop. Run: node scripts/test_delegate_account.js
// Uses TEMPORARY copies of the tables on one connection: they hide the real tables for this connection only,
// so no real row is touched, and no email is sent. They vanish when the script ends.
require('dotenv').config({ quiet: true });
const assert = require('assert');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const sent = [];
const mailPath = require.resolve('../services/mailService');
require(mailPath);
let mailDown = false;
require.cache[mailPath].exports.sendTemplateEmail = async (key, to, vars, options) => {
  sent.push({ key, to, vars, options });
  if (mailDown) throw new Error('mail down');
};
const claimMails = () => sent.filter((mail) => mail.key === 'workshop_claim_confirmation');
// The claim does not wait for its email, so give it a moment to go out.
const waitForClaimMails = async (count) => {
  for (let i = 0; i < 100 && claimMails().length < count; i += 1) await new Promise((resolve) => setTimeout(resolve, 20));
  assert.strictEqual(claimMails().length, count, 'one email per successful claim');
};

const call = (handler, { body = {}, params = {}, delegate, headers = {} } = {}) => new Promise((resolve, reject) => {
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { resolve({ status: this.statusCode, data }); return this; },
    setHeader() {},
    send(data) { resolve({ status: this.statusCode, data }); },
  };
  handler({ body, params, delegate, headers, method: 'POST', originalUrl: '/test' }, res, reject);
});

(async () => {
  const connection = await db.pool.getConnection();
  try {
    for (const table of ['delegates', 'workshops', 'workshop_applications', 'workshop_registrations']) {
      // MySQL refuses LIKE onto the same name, so copy under another name and rename the copy.
      await connection.query('CREATE TEMPORARY TABLE tmp_' + table + ' LIKE ' + table);
      await connection.query('ALTER TABLE tmp_' + table + ' RENAME TO ' + table);
    }
    for (const [column, type] of Object.entries({
      login_otp_hash: 'VARCHAR(64) NULL', login_otp_expires_at: 'DATETIME NULL', login_otp_attempts: 'INT NOT NULL DEFAULT 0', login_otp_sent_at: 'DATETIME NULL',
      claimed_workshop_id: 'INT NULL', workshop_claimed_at: 'DATETIME NULL',
      workshop_notice_sent_at: 'DATETIME NULL', workshop_notice_send_count: 'INT NOT NULL DEFAULT 0', workshop_notice_last_attempt_at: 'DATETIME NULL', workshop_notice_last_error: 'TEXT NULL',
    })) {
      const [[found]] = await connection.query("SELECT COUNT(*) AS n FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'delegates' AND column_name = ?", [column]);
      if (!found.n) await connection.query(`ALTER TABLE delegates ADD COLUMN ${column} ${type}`);
    }
    // Every query below runs on this one connection, so it only ever sees the temporary tables.
    const realPool = db.getPool();
    realPool.query = connection.query.bind(connection);
    realPool.getConnection = async () => Object.assign(Object.create(connection), { release() {} });
    const [[{ total }]] = await db.pool.query('SELECT COUNT(*) AS total FROM delegates');
    assert.strictEqual(total, 0, 'stop: the code under test must see the empty temporary table, not the real one');

    const account = require('../controllers/delegateAccountController');
    const { requireDelegate, requireAuth } = require('../middleware/authMiddleware');

    await connection.query(`INSERT INTO delegates (id, registration_id, full_name, name_key, email, phone, checkin_token) VALUES
      (1, 'GHC26-DEL-00001', 'Test One', 'test one', 'one@example.test', '9000000001', 'GHCDEL-ONE'),
      (2, 'GHC26-DEL-00002', 'Test Two', 'test two', 'two@example.test', '9000000002', 'GHCDEL-TWO'),
      (3, 'GHC26-DEL-00003', 'No Email', 'no email', NULL, NULL, 'GHCDEL-THREE')`);
    await connection.query(`INSERT INTO workshops (id, title, date, venue, faculty, capacity, registered_count, status, is_enabled, is_registration_open, is_open_to_all) VALUES
      (10, 'Basic <Life> Support', '2026-11-28 19:00:00', 'Hall A', NULL, 1, 0, 'published', 1, 1, 0),
      (11, 'Suturing', NULL, NULL, NULL, 5, 0, 'published', 1, 1, 0),
      (12, 'Hidden Draft', NULL, NULL, NULL, 5, 0, 'draft', 1, 1, 0),
      (13, 'Coming Soon', NULL, NULL, NULL, 5, 0, 'published', 0, 1, 0),
      (14, 'Toolkit', NULL, NULL, NULL, 0, 0, 'published', 1, 1, 1)`);

    // Requesting a code: same answer for every ID, one email per cooldown.
    const known = await call(account.requestOtp, { body: { delegateId: ' ghc26-del-00001 ' } });
    const unknown = await call(account.requestOtp, { body: { delegateId: 'GHC26-DEL-99999' } });
    const noEmail = await call(account.requestOtp, { body: { delegateId: 'GHC26-DEL-00003' } });
    assert.strictEqual(known.status, 200);
    assert.deepStrictEqual(known.data, unknown.data, 'an unknown ID looks the same as a real one');
    assert.deepStrictEqual(known.data, noEmail.data, 'a delegate without email looks the same too');
    assert.strictEqual(sent.length, 1, 'only the real delegate gets a mail');
    assert.ok(!JSON.stringify(known.data).includes('example.test'), 'the email address is never returned');
    await call(account.requestOtp, { body: { delegateId: 'GHC26-DEL-00001' } });
    assert.strictEqual(sent.length, 1, 'a second request inside the cooldown sends nothing');

    // Checking a code.
    const { otp } = sent[0].vars;
    assert.match(otp, /^\d{6}$/);
    const verify = (code, delegateId = 'GHC26-DEL-00001') => call(account.verifyOtp, { body: { delegateId, otp: code } });
    const wrong = otp === '000000' ? '000001' : '000000';
    assert.strictEqual((await verify(wrong)).status, 401, 'a wrong code fails');
    assert.strictEqual((await verify(otp, 'GHC26-DEL-00002')).status, 401, 'the code only works for its own delegate');
    const [[{ login_otp_hash: stored }]] = await connection.query('SELECT login_otp_hash FROM delegates WHERE id = 1');
    assert.ok(!stored.includes(otp), 'the code is not stored in plain text');

    const good = await verify(otp);
    assert.strictEqual(good.status, 200, 'the right code logs in');
    assert.strictEqual((await verify(otp)).status, 401, 'a code works only once');

    // The token works for delegate routes and nowhere else.
    const auth = { authorization: `Bearer ${good.data.token}` };
    const asDelegate = await new Promise((resolve) => {
      const req = { headers: auth };
      requireDelegate(req, { status: () => ({ json: () => resolve(null) }) }, () => resolve(req.delegate));
    });
    assert.strictEqual(asDelegate.id, 1);
    assert.strictEqual(jwt.decode(good.data.token).id, undefined, 'no id claim, because /api/auth/me reads id without checking the type');
    const adminStatus = await new Promise((resolve, reject) => {
      requireAuth({ headers: auth, originalUrl: '/x' }, { status: (code) => ({ json: () => resolve(code) }) }, () => reject(new Error('A delegate token passed requireAuth')));
    });
    assert.strictEqual(adminStatus, 401, 'a delegate token is refused on admin routes');

    // Too many wrong codes burn the code, even if the right one follows.
    await connection.query('UPDATE delegates SET login_otp_sent_at = NULL WHERE id = 2');
    await call(account.requestOtp, { body: { delegateId: 'GHC26-DEL-00002' } });
    const otp2 = sent[sent.length - 1].vars.otp;
    const wrong2 = otp2 === '000000' ? '000001' : '000000';
    for (let i = 0; i < 5; i += 1) await verify(wrong2, 'GHC26-DEL-00002');
    assert.strictEqual((await verify(otp2, 'GHC26-DEL-00002')).status, 401, 'locked after five wrong tries');

    // Claiming: one per delegate, seats go down, the last seat goes once.
    const load = async (id) => (await connection.query('SELECT * FROM delegates WHERE id = ?', [id]))[0][0];
    const claim = async (delegateId, id) => call(account.claimWorkshop, { params: { id }, delegate: await load(delegateId) });
    const seats = async (id) => (await connection.query('SELECT registered_count FROM workshops WHERE id = ?', [id]))[0][0].registered_count;

    assert.strictEqual((await claim(1, 12)).status, 409, 'a draft cannot be claimed');
    assert.strictEqual((await claim(1, 13)).status, 409, 'a coming soon workshop cannot be claimed');
    assert.strictEqual((await claim(1, 14)).status, 409, 'the open-to-all workshop is not something to claim');
    assert.strictEqual(await seats(14), 0, 'and it takes no seat');
    assert.strictEqual((await load(1)).claimed_workshop_id, null, 'so the delegate can still choose a limited one');
    const first = await claim(1, 10);
    assert.strictEqual(first.status, 201, 'the first claim works');
    assert.strictEqual(await seats(10), 1, 'the seat count goes up, so available seats go down');
    assert.strictEqual(first.data.claimedWorkshop.availableSeats, 0);
    assert.strictEqual((await load(1)).claimed_workshop_id, 10);

    const [[application]] = await connection.query('SELECT * FROM workshop_applications WHERE workshop_id = 10');
    assert.strictEqual(application.application_status, 'CONFIRMED', 'the workshop team sees it as a confirmed attendee');
    assert.strictEqual(application.ghc_registration_id, 'GHC26-DEL-00001');

    await waitForClaimMails(1);
    const claimMail = claimMails()[0];
    assert.strictEqual(claimMail.to, 'one@example.test', 'the email goes to the delegate who claimed');
    assert.strictEqual(claimMail.vars.workshopTitle, 'Basic &lt;Life&gt; Support', 'CMS text is escaped');
    assert.match(claimMail.vars.workshopWhen, /28 November 2026.*7:00 pm/, 'the date and time are what the CMS stored');
    assert.strictEqual(claimMail.vars.workshopFaculty, 'To be announced', 'a blank CMS field still reads properly');
    assert.strictEqual(claimMail.vars.workshopRegistrationId, application.workshop_registration_id, 'the email has the ID the workshop team sees');
    assert.match(claimMail.vars.openToAllNote, /Toolkit workshop is open for all/);

    assert.strictEqual((await claim(1, 11)).status, 409, 'a second claim is refused');
    assert.strictEqual(await seats(11), 0, 'a refused claim takes no seat');
    assert.strictEqual((await claim(2, 10)).status, 409, 'someone else cannot take a full workshop');
    assert.strictEqual(await seats(10), 1, 'a full workshop never goes over capacity');
    assert.strictEqual((await load(2)).claimed_workshop_id, null, 'a failed claim leaves the delegate free to choose again');
    assert.strictEqual(claimMails().length, 1, 'a refused claim sends no email');
    mailDown = true;
    assert.strictEqual((await claim(2, 11)).status, 201, 'they can then choose another, and a mail failure does not undo the claim');
    await waitForClaimMails(2);
    mailDown = false;
    assert.strictEqual((await load(2)).claimed_workshop_id, 11);

    const [[{ n }]] = await connection.query('SELECT COUNT(*) AS n FROM workshop_applications');
    assert.strictEqual(n, 2, 'one application per successful claim');

    const list = await call(account.listWorkshops, { delegate: await load(1) });
    assert.strictEqual(list.data.claimedWorkshop.id, 10, 'the dashboard shows the chosen workshop');
    assert.ok(list.data.workshops.every((w) => w.status === 'published'), 'drafts are not listed');

    // The email names whatever the CMS has marked open to all, and nothing else.
    const { openToAllNote } = require('../controllers/delegateController');
    assert.strictEqual(await openToAllNote(), 'The Toolkit workshop is open for all delegates, so you do not need to apply for it.');
    await connection.query("UPDATE workshops SET title = 'Renamed <Kit>', venue = 'Hall B' WHERE id = 14");
    assert.strictEqual(await openToAllNote(), 'The Renamed &lt;Kit&gt; workshop at Hall B is open for all delegates, so you do not need to apply for it.');
    await connection.query("UPDATE workshops SET status = 'draft' WHERE id = 14");
    assert.strictEqual(await openToAllNote(), '', 'an unpublished workshop is not mentioned');

    // Workshop notification: one email with the banner, then the bulk send skips them.
    const { sendWorkshopNotice } = require('../controllers/delegateController');
    const notice = await call(sendWorkshopNotice, { params: { id: 1 } });
    assert.strictEqual(notice.status, 200);
    assert.ok(notice.data.delegate.workshopNoticeSentAt, 'the delegate is marked as sent');
    const noticeMail = sent.find((mail) => mail.key === 'workshop_notice');
    assert.strictEqual(noticeMail.to, 'one@example.test');
    assert.ok(noticeMail.options.attachments[0].content.length > 10000, 'the banner image goes with it');
    assert.strictEqual((await call(sendWorkshopNotice, { params: { id: 1 }, body: { onlyIfNotSent: true } })).status, 409, 'the bulk send skips someone already sent');
    assert.strictEqual((await call(sendWorkshopNotice, { params: { id: 3 } })).status, 400, 'no email address, nothing sent');

    // Login codes use Brevo only once it is fully set up; nothing else moves to it.
    const { providerForTemplate, sendForTemplate } = require('../services/mailService');
    const saved = { login: process.env.BREVO_SMTP_LOGIN, key: process.env.BREVO_SMTP_KEY };
    delete process.env.BREVO_SMTP_KEY;
    process.env.BREVO_SMTP_LOGIN = 'login@example.test';
    assert.strictEqual(providerForTemplate('delegate_login_otp'), undefined, 'no key: the normal provider still sends login codes');
    process.env.BREVO_SMTP_KEY = 'test-key';
    assert.strictEqual(providerForTemplate('delegate_login_otp'), 'brevo');
    assert.strictEqual(providerForTemplate('delegate_dashboard_open'), undefined, 'other emails stay where they are');
    assert.strictEqual(providerForTemplate('abstract_accepted'), 'resend', 'abstract emails stay on Resend');

    const tried = [];
    const brevoDown = async ({ provider }) => {
      tried.push(provider);
      if (provider) throw new Error('down');
      return 'sent';
    };
    assert.strictEqual(await sendForTemplate('delegate_login_otp', {}, brevoDown), 'sent', 'a Brevo failure still delivers the code');
    assert.deepStrictEqual(tried, ['brevo', undefined], 'Brevo first, then the normal provider');
    tried.length = 0;
    await assert.rejects(sendForTemplate('abstract_accepted', {}, brevoDown), /Resend: down \| Brevo: down/, 'both reasons are kept');
    assert.deepStrictEqual(tried, ['resend', 'brevo'], 'abstract emails also fall back to Brevo');
    tried.length = 0;

    // Resend's daily quota: every other email goes out through Brevo instead.
    const resendFull = async ({ provider }) => {
      tried.push(provider);
      if (provider !== 'brevo') throw new Error('You have reached your daily email sending quota.');
      return { provider: 'brevo' };
    };
    assert.deepStrictEqual(await sendForTemplate('workshop_notice', {}, resendFull), { provider: 'brevo' }, 'a full Resend quota no longer loses the email');
    assert.deepStrictEqual(tried, [undefined, 'brevo']);
    tried.length = 0;
    delete process.env.BREVO_SMTP_KEY;
    await assert.rejects(sendForTemplate('workshop_notice', {}, resendFull), /quota/, 'without Brevo set up there is nothing to fall back to');
    assert.deepStrictEqual(tried, [undefined]);
    process.env.BREVO_SMTP_KEY = 'test-key';
    tried.length = 0;
    const bothDown = async ({ provider }) => { tried.push(provider); throw new Error('all down'); };
    await assert.rejects(sendForTemplate('delegate_login_otp', {}, bothDown), /all down/, 'if both fail, the login page gets the error');
    assert.strictEqual(tried.length, 2);
    // Brevo over HTTPS: the request Brevo expects, and its errors come back readable.
    const { sendViaBrevoApi } = require('../services/mailService');
    let posted = null;
    const brevoOk = async (url, options) => { posted = { url, options, body: JSON.parse(options.body) }; return { ok: true, json: async () => ({ messageId: '<m1>' }) }; };
    process.env.BREVO_API_KEY = 'api-test-key';
    const apiResult = await sendViaBrevoApi({ from: '"Global Healthcare Conclave" <no-reply@ghc.gaims.org>', to: 'one@example.test', subject: 'Hi', html: '<p>Hi</p>', attachments: [{ filename: 'a.pdf', content: Buffer.from('pdf') }] }, brevoOk);
    assert.strictEqual(apiResult.provider, 'brevo');
    assert.strictEqual(posted.url, 'https://api.brevo.com/v3/smtp/email');
    assert.strictEqual(posted.options.headers['api-key'], 'api-test-key');
    assert.deepStrictEqual(posted.body.sender, { name: 'Global Healthcare Conclave', email: 'no-reply@ghc.gaims.org' });
    assert.deepStrictEqual(posted.body.to, [{ email: 'one@example.test' }]);
    assert.deepStrictEqual(posted.body.attachment, [{ name: 'a.pdf', content: Buffer.from('pdf').toString('base64') }]);
    const brevoRefuses = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Key not found' }) });
    await assert.rejects(sendViaBrevoApi({ from: 'x@y.z', to: 'one@example.test', subject: 'Hi', html: '' }, brevoRefuses), /Key not found/);
    posted = null;
    await assert.rejects(sendViaBrevoApi({ from: 'x@y.z', to: 'a@b.c', subject: 'Hi', html: '', attachments: [{ filename: 'i.jpg', content: Buffer.from('x'), cid: 'hero' }] }, brevoOk), /embedded images/);
    assert.strictEqual(posted, null, 'an email with embedded images is not sent half-broken');
    delete process.env.BREVO_API_KEY;

    // Mailjet: embedded images go as inline parts, files as attachments, and its errors come back readable.
    const { sendViaMailjet } = require('../services/mailService');
    process.env.MAILJET_API_KEY = 'mj-key';
    process.env.MAILJET_SECRET_KEY = 'mj-secret';
    const mailjetOk = async (url, options) => {
      posted = { url, options, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ Messages: [{ Status: 'success', To: [{ MessageID: 123 }] }] }) };
    };
    const mjResult = await sendViaMailjet({
      from: '"Global Healthcare Conclave" <no-reply@ghc.gaims.org>', to: 'one@example.test', subject: 'Hi', html: '<img src="cid:hero">',
      attachments: [{ filename: 'hero.jpg', content: Buffer.from('img'), contentType: 'image/jpeg', cid: 'hero' }, { filename: 'a.pdf', content: Buffer.from('pdf'), contentType: 'application/pdf' }],
    }, mailjetOk);
    assert.deepStrictEqual(mjResult.id, '123');
    assert.strictEqual(posted.url, 'https://api.mailjet.com/v3.1/send');
    assert.strictEqual(posted.options.headers.authorization, `Basic ${Buffer.from('mj-key:mj-secret').toString('base64')}`);
    const mjMessage = posted.body.Messages[0];
    assert.deepStrictEqual(mjMessage.From, { Email: 'no-reply@ghc.gaims.org', Name: 'Global Healthcare Conclave' });
    assert.deepStrictEqual(mjMessage.InlinedAttachments, [{ ContentType: 'image/jpeg', Filename: 'hero.jpg', Base64Content: Buffer.from('img').toString('base64'), ContentID: 'hero' }], 'embedded images stay embedded');
    assert.deepStrictEqual(mjMessage.Attachments.map((a) => a.Filename), ['a.pdf']);
    const mailjetRefuses = async () => ({ ok: false, status: 400, json: async () => ({ Messages: [{ Status: 'error', Errors: [{ ErrorMessage: 'Sender not validated' }] }] }) });
    await assert.rejects(sendViaMailjet({ from: 'x@y.z', to: 'a@b.c', subject: 'Hi', html: '' }, mailjetRefuses), /Sender not validated/);

    // The full chain: Resend full and Brevo refusing still delivers through Mailjet.
    tried.length = 0;
    const onlyMailjet = async ({ provider }) => {
      tried.push(provider);
      if (provider !== 'mailjet') throw new Error(`${provider || 'resend'} down`);
      return { provider: 'mailjet' };
    };
    assert.deepStrictEqual(await sendForTemplate('workshop_notice', {}, onlyMailjet), { provider: 'mailjet' });
    assert.deepStrictEqual(tried, [undefined, 'brevo', 'mailjet'], 'Resend, then Brevo, then Mailjet');
    tried.length = 0;
    assert.deepStrictEqual(await sendForTemplate('delegate_login_otp', {}, onlyMailjet), { provider: 'mailjet' });
    assert.deepStrictEqual(tried, ['brevo', undefined, 'mailjet'], 'login codes: Brevo, then Resend, then Mailjet');
    tried.length = 0;
    await assert.rejects(sendForTemplate('abstract_accepted', {}, async ({ provider }) => { tried.push(provider); throw new Error('down'); }), /Resend: down \| Brevo: down \| Mailjet: down/);
    assert.deepStrictEqual(tried, ['resend', 'brevo', 'mailjet'], 'Resend is not tried twice');
    delete process.env.MAILJET_API_KEY;
    delete process.env.MAILJET_SECRET_KEY;

    if (saved.login === undefined) delete process.env.BREVO_SMTP_LOGIN; else process.env.BREVO_SMTP_LOGIN = saved.login;
    if (saved.key === undefined) delete process.env.BREVO_SMTP_KEY; else process.env.BREVO_SMTP_KEY = saved.key;

    console.log('Delegate account self-check passed.');
  } finally {
    // Ending the connection removes the temporary tables.
    connection.release();
    await db.closePool();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
