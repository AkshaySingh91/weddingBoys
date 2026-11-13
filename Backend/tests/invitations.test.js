import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCode, cleanName } from '../Services/invitations.js';
import { enquirySchema } from '../Utils/enquiryValidation.js';

test('invitation codes are 8 unambiguous characters', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i++) {
        const c = newCode();
        assert.match(c, /^[2-9A-HJKMNP-TV-Z]{8}$/);
        seen.add(c);
    }
    assert.ok(seen.size > 1990, 'codes do not repeat in practice');
});

test('only plain names are printed on an invitation the studio hosts', () => {
    assert.equal(cleanName(' Riya '), 'Riya');
    assert.equal(cleanName("D'Souza-Mehta"), "D'Souza-Mehta");
    assert.equal(cleanName('प्रिया'), 'प्रिया');
    assert.equal(cleanName('St. John'), 'St. John');
    for (const bad of ['Visit www.spam.com', 'spam.in', 'http x', 'call 9876543210', '<b>x</b>', 'a'.repeat(41), '', null]) assert.equal(cleanName(bad), '');
});

test('the enquiry carries the light and the selects, and refuses anything else', () => {
    const ok = enquirySchema.parse({ bride: 'Riya', contact: '9876543210', grade: 'haldi', selects: ['0123456789abcdef01234567'] });
    assert.equal(ok.grade, 'haldi');
    assert.deepEqual(ok.selects, ['0123456789abcdef01234567']);
    assert.equal(enquirySchema.parse({ bride: 'Riya', contact: '9876543210' }).grade, 'ivory');
    assert.equal(enquirySchema.safeParse({ bride: 'Riya', contact: '9876543210', grade: 'neon' }).success, false);
    assert.equal(enquirySchema.safeParse({ bride: 'Riya', contact: '9876543210', selects: ['not-an-id'] }).success, false);
});
