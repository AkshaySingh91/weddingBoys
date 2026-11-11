import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import Enquiry from '../Models/EnquirySchema.js';
import WebsiteSettings from '../Models/WebsiteSettingSchema.js';
import { submitEnquiry } from '../Controllers/enquiryController.js';
import { deliverNextEnquiry, enquiryMail } from '../Services/enquiryNotifications.js';
import { enquirySchema } from '../Utils/enquiryValidation.js';
import { rateLimit } from '../Middleware/rateLimit.js';

const response = () => ({ code: 200, status(n) { this.code = n; return this; }, json(body) { this.body = body; return this; }, set() { return this; } });
const details = { bride: 'Asha', groom: 'Rahul', contact: '+91 98765 43210', eventDate: { start: '2027-01-15' } };

test('enquiries normalize contact details, allow an optional end/referral, and reject invalid dates', () => {
    const parsed = enquirySchema.parse(details);
    assert.equal(parsed.contact, '+919876543210');
    assert.equal(parsed.eventDate.end, '2027-01-15');
    assert.equal(parsed.reach, '');
    for (const eventDate of [{ start: 'not-a-date' }, { start: '2027-02-30' }, { start: '2027-01-15', end: '2027-01-14' }]) {
        assert.equal(enquirySchema.safeParse({ ...details, eventDate }).success, false);
    }
});

test('retrying an accepted enquiry saves one lead and never trusts a supplied recipient', async (t) => {
    const stored = [];
    t.mock.method(Enquiry, 'findOne', async ({ requestId }) => stored.find((e) => e.requestId === requestId));
    const create = t.mock.method(Enquiry, 'create', async (doc) => { stored.push({ _id: 'receipt', ...doc }); return stored[0]; });
    const req = { body: { ...details, studioEmail: 'untrusted@example.invalid' }, get: () => '00000000-0000-4000-8000-000000000001' };
    for (let i = 0; i < 2; i++) {
        const res = response(); await submitEnquiry(req, res);
        assert.equal(res.code, 201);
        assert.equal(res.body.enquiryId, 'receipt');
    }
    assert.equal(create.mock.callCount(), 1);
    assert.equal('studioEmail' in stored[0], false);
    const changed = response(); await submitEnquiry({ ...req, body: { ...req.body, bride: 'Different' } }, changed);
    assert.equal(changed.code, 409);
});

test('an invalid enquiry does not write a lead', async (t) => {
    const create = t.mock.method(Enquiry, 'create', () => assert.fail('must not persist'));
    const res = response();
    await submitEnquiry({ body: { ...details, eventDate: { start: 'tomorrow' } } }, res);
    assert.equal(res.code, 400);
    assert.equal(create.mock.callCount(), 0);
});

test('notification failures remain pending, use the configured recipient, and escape HTML', async (t) => {
    const previous = process.env.ENQUIRY_RECIPIENT;
    delete process.env.ENQUIRY_RECIPIENT;
    t.after(() => previous === undefined ? delete process.env.ENQUIRY_RECIPIENT : process.env.ENQUIRY_RECIPIENT = previous);
    const lead = { _id: 'lead', Bride: '<img src=x onerror=alert(1)>', Groom: 'Rahul', Contact: 'person@example.invalid', Date: { start: '2027-01-15', end: '2027-01-15' }, notification: { attempts: 1 } };
    t.mock.method(Enquiry, 'findOneAndUpdate', async () => lead);
    t.mock.method(WebsiteSettings, 'findOne', () => ({ select() { return this; }, lean: async () => ({ companyDetails: { email: 'studio@example.invalid' } }) }));
    const updates = [];
    t.mock.method(Enquiry, 'updateOne', async (_filter, update) => { updates.push(update.$set); return {}; });
    let fail = true;
    t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async (mail) => {
        assert.equal(mail.to, 'studio@example.invalid');
        assert.ok(!mail.html.includes('<img'));
        assert.ok(mail.html.includes('&lt;img'));
        if (fail) throw new Error('Synthetic SMTP outage');
        return {};
    } }));
    t.mock.method(console, 'error', () => {});
    await deliverNextEnquiry();
    assert.equal(updates[0]['notification.status'], 'Pending');
    fail = false;
    await deliverNextEnquiry();
    assert.equal(updates[1]['notification.status'], 'Sent');
});

test('public abuse limits reject excess requests while keeping separate IP buckets', () => {
    const guard = rateLimit({ limit: 1, windowMs: 60000 });
    let accepted = 0;
    guard({ ip: '127.0.0.1' }, response(), () => accepted++);
    const denied = response(); guard({ ip: '127.0.0.1' }, denied, () => accepted++);
    guard({ ip: '127.0.0.2' }, response(), () => accepted++);
    assert.equal(denied.code, 429);
    assert.equal(accepted, 2);
});

test('the invitation needs only a name and a way to reply; date, partner and context are optional', () => {
    const parsed = enquirySchema.parse({ bride: 'Riya', contact: '9876543210' });
    assert.equal(parsed.groom, '');
    assert.equal(parsed.eventDate, null);
    assert.equal(parsed.channel, 'form');
    const later = enquirySchema.parse({ bride: 'Riya', groom: 'Arjun', contact: 'riya@example.com', dateNote: 'December 2026',
        kind: 'Wedding', city: 'Udaipur', source: 'film', context: "Krishna & Vishakha's film", channel: 'whatsapp', eventDate: { start: '' } });
    assert.equal(later.eventDate, null);
    assert.equal(later.dateNote, 'December 2026');
    assert.equal(later.channel, 'whatsapp');
    assert.equal(enquirySchema.safeParse({ contact: '9876543210' }).success, false, 'a name is still required');
    assert.equal(enquirySchema.safeParse({ bride: 'Riya', contact: '12' }).success, false, 'a usable contact is still required');
    assert.equal(enquirySchema.safeParse({ bride: 'Riya', contact: '9876543210', channel: 'sms' }).success, false);
});

test('a notification without an exact date says what they gave instead', () => {
    const mail = enquiryMail({ Bride: 'Riya', Groom: '', Contact: '+919876543210', Date: null, DateNote: 'Not fixed yet',
        Kind: 'Pre-wedding shoot', City: 'Varanasi', Source: 'varanasi', Channel: 'whatsapp' });
    assert.match(mail.text, /When: Not fixed yet/);
    assert.match(mail.text, /For: Pre-wedding shoot/);
    assert.match(mail.text, /Sent by: WhatsApp/);
    assert.match(mail.subject, /Riya, Pre-wedding shoot/);
    assert.doesNotMatch(mail.text + mail.html, /undefined|null/);
    assert.match(enquiryMail({ Bride: 'A', Groom: 'B', Contact: 'x', Date: { start: '2027-01-15', end: '2027-01-17' } }).text, /When: 2027-01-15 – 2027-01-17/);
});
