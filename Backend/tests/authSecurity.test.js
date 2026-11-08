import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { generate, NobleCryptoPlugin, ScureBase32Plugin } from 'otplib';
import Admin from '../Models/adminSchema.js';
import Session from '../Models/Session.js';
import { saveProfile, verifyProfile, getProfile, changePassword } from '../Controllers/profileController.js';
import { mfaLoginVerify, mfaRecoveryVerify } from '../Controllers/authController.js';
import { verifyToken } from '../Middleware/auth.js';
import { authorizeAdmin, protectAdmin } from '../Middleware/adminPolicy.js';
import { COOKIE_NAME } from '../constants.js';
import { hashToken, signAccessToken, signMfaTempToken, verifyAccessToken } from '../Utils/authTokens.js';
import { signPreviewToken, verifyPreviewToken } from '../Utils/previewTokens.js';
import { generateTotpSecret } from '../Utils/totp.js';

const actor = '000000000000000000000001';
const other = '000000000000000000000002';
const response = () => ({
    code: 200, cookies: [], cookieOptions: [], status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    cookie(name, _value, options) { this.cookies.push(name); this.cookieOptions.push({ name, options }); return this; }, clearCookie() { return this; },
});
const account = (overrides = {}) => ({
    _id: actor, name: 'Audit Staff', email: 'staff@example.invalid', status: 'Active', role: 'Editor',
    authVersion: 0, avatar: null, save: async () => {}, ...overrides,
});
function secret(t) {
    const previous = process.env.JWT_SECRET_KEY;
    process.env.JWT_SECRET_KEY = randomBytes(32).toString('hex');
    t.after(() => previous === undefined ? delete process.env.JWT_SECRET_KEY : process.env.JWT_SECRET_KEY = previous);
}

test('both profile save entry points reject another account before database access', async (t) => {
    const find = t.mock.method(Admin, 'findById', () => { throw new Error('must not query'); });
    for (const handler of [saveProfile, verifyProfile]) {
        const res = response();
        await handler({ user: { id: actor }, body: { admin: { id: other }, isAvatarUpdated: false } }, res);
        assert.equal(res.code, 403);
    }
    assert.equal(find.mock.callCount(), 0);
});

test('profile loads by authenticated ID with no phone or avatar', async (t) => {
    const admin = account();
    const find = t.mock.method(Admin, 'findById', (id) => { assert.equal(id, actor); return { lean: async () => admin }; });
    const res = response();
    await getProfile({ user: { id: actor } }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.adminDetail.avatar, null);
    assert.equal(res.body.adminDetail.phone, '');
    assert.equal(find.mock.callCount(), 1);
});

test('self-profile updates use the current access cookie and preserve the account role', async (t) => {
    secret(t);
    const admin = account();
    t.mock.method(Admin, 'findById', async () => admin);
    const res = response();
    await saveProfile({ user: { id: actor }, body: { admin: { name: 'Updated Staff', email: admin.email }, isAvatarUpdated: false } }, res);
    assert.equal(res.code, 200);
    assert.equal(admin.name, 'Updated Staff');
    assert.equal(admin.role, 'Editor');
    assert.deepEqual(res.cookies, [COOKIE_NAME.access_token]);
});

test('email changes require the current password before saving', async (t) => {
    const admin = account({ password: await bcrypt.hash('old-password1', 4) });
    const save = t.mock.fn(); admin.save = save;
    t.mock.method(Admin, 'findById', async () => admin);
    const res = response();
    await saveProfile({ user: { id: actor }, body: { admin: { name: admin.name, email: 'new@example.invalid' }, isAvatarUpdated: false } }, res);
    assert.equal(res.code, 403);
    assert.equal(save.mock.callCount(), 0);
});

test('password changes revoke device sessions and invalidate old access-token versions', async (t) => {
    const admin = account({ password: await bcrypt.hash('old-password1', 4) });
    t.mock.method(Admin, 'findById', async () => admin);
    const revoke = t.mock.method(Session, 'updateMany', async () => ({}));
    const res = response();
    await changePassword({ user: { id: actor }, body: { currentPassword: 'old-password1', newPassword: 'new-password2', confirmPassword: 'new-password2' } }, res);
    assert.equal(res.code, 200);
    assert.equal(admin.authVersion, 1);
    assert.equal(await bcrypt.compare('new-password2', admin.password), true);
    assert.equal(revoke.mock.callCount(), 1);
    assert.equal(res.body.requiresLogin, true);
});

test('tampered signed cookies are rejected without throwing or querying the database', async (t) => {
    const find = t.mock.method(Admin, 'findById', () => { throw new Error('must not query'); });
    const res = response();
    await verifyToken({ signedCookies: { [COOKIE_NAME.access_token]: false } }, res, () => assert.fail('authorized'));
    assert.equal(res.code, 401);
    assert.equal(find.mock.callCount(), 0);
});

test('authorization uses the current account role and rejects suspended or revoked accounts', async (t) => {
    secret(t);
    const admin = account({ role: 'PortfolioManager' });
    const token = signAccessToken(account({ role: 'SuperAdmin' }));
    t.mock.method(Admin, 'findById', () => ({ select() { return this; }, lean: async () => admin }));
    const req = { signedCookies: { [COOKIE_NAME.access_token]: token } };
    await verifyToken(req, response(), () => {});
    assert.equal(req.user.role, 'PortfolioManager');
    for (const update of [{ status: 'Suspended' }, { status: 'Active', authVersion: 1 }]) {
        Object.assign(admin, update);
        const res = response();
        await verifyToken({ signedCookies: req.signedCookies }, res, () => assert.fail('authorized'));
        assert.equal(res.code, 401);
    }
});

test('role policy blocks cross-domain writes, including already-published blog edits', () => {
    for (const [role, method, path, allowed] of [
        ['Editor', 'PATCH', '/api/admin/portfolio/123', false],
        ['PortfolioManager', 'PUT', '/api/admin/blogs/123', false],
        ['PortfolioManager', 'POST', '/api/admin/blogs/123/revisions/456/restore', false],
        ['Editor', 'PUT', '/api/admin/blogs/123', true],
        ['PortfolioManager', 'PATCH', '/api/admin/clients/123', true],
        ['Editor', 'PUT', '/api/admin/config', false],
        ['Editor', 'POST', '/api/admin/uploads/create', true],
        ['SuperAdmin', 'DELETE', '/api/admin/users/123', true],
        ['Editor', 'GET', '/API/ADMIN/GET-CLIENTS-ENQUIRY', false],
    ]) {
        let continued = false;
        authorizeAdmin({ method, originalUrl: path, user: { role } }, response(), () => { continued = true; });
        assert.equal(continued, allowed, `${role} ${method} ${path}`);
    }
});

test('the admin gate leaves only the explicit public POST endpoints unauthenticated', async () => {
    let continued = false;
    await protectAdmin({ method: 'POST', originalUrl: '/api/admin/auth/login' }, response(), () => { continued = true; });
    assert.equal(continued, true);
    for (const originalUrl of ['/api/admin/auth/me', '/api/admin/profile/save', '/api/admin/users']) {
        const res = response();
        await protectAdmin({ method: 'POST', originalUrl }, res, () => assert.fail('must require authentication'));
        assert.equal(res.code, 401);
    }
});

test('a database outage is reported as unavailable rather than an expired token', async (t) => {
    secret(t);
    t.mock.method(Admin, 'findById', () => ({ select() { return this; }, lean: async () => { throw new Error('Synthetic database outage'); } }));
    const res = response();
    await verifyToken({ signedCookies: { [COOKIE_NAME.access_token]: signAccessToken(account()) } }, res, () => assert.fail('must not authorize'));
    assert.equal(res.code, 503);
});

test('both MFA verification methods stop locked accounts before checking codes or updating records', async (t) => {
    secret(t);
    const admin = account({ mfaEnabled: true, mfaSecret: 'unused', accountLockedUntil: new Date(Date.now() + 60000) });
    t.mock.method(Admin, 'findById', () => ({ select: async () => admin }));
    const update = t.mock.method(Admin, 'updateOne', () => assert.fail('must not update'));
    const tempToken = signMfaTempToken(admin, 'challenge');
    for (const handler of [mfaLoginVerify, mfaRecoveryVerify]) {
        const res = response();
        await handler({ body: { tempToken, code: '000000', recoveryCode: 'invalid-code' } }, res);
        assert.equal(res.code, 423);
    }
    assert.equal(update.mock.callCount(), 0);
});

test('a valid MFA challenge can be consumed only once and honors remember-me', async (t) => {
    secret(t);
    const challengeId = 'synthetic-challenge';
    const admin = account({ mfaEnabled: true, mfaSecret: await generateTotpSecret(), mfaChallengeHash: hashToken(challengeId), mfaChallengeExpiresAt: new Date(Date.now() + 60000), mfaRecoveryCodes: [] });
    const code = await generate({ secret: admin.mfaSecret, crypto: new NobleCryptoPlugin(), base32: new ScureBase32Plugin() });
    t.mock.method(Admin, 'findById', () => ({ select: async () => admin }));
    t.mock.method(Admin, 'findOneAndUpdate', (filter) => ({ select: async () => {
        assert.equal(filter.mfaChallengeHash, admin.mfaChallengeHash);
        admin.mfaChallengeHash = null;
        return admin;
    } }));
    const issue = t.mock.method(Session, 'create', async () => ({}));
    const tempToken = signMfaTempToken(admin, challengeId, false);
    const req = { body: { tempToken, code }, headers: {}, ip: '127.0.0.1' };
    const res = response();
    await mfaLoginVerify(req, res);
    assert.equal(res.code, 200);
    const replay = response(); await mfaLoginVerify(req, replay);
    assert.equal(replay.code, 401);
    assert.equal(issue.mock.callCount(), 1);
    assert.equal(issue.mock.calls[0].arguments[0].rememberMe, false);
    assert.equal(res.cookieOptions.find((c) => c.name === COOKIE_NAME.refresh_token).options.expires, undefined);
});

test('preview tokens reject the old public fallback and fail closed without a private key', (t) => {
    secret(t);
    const oldPreview = process.env.BLOG_PREVIEW_SECRET;
    delete process.env.BLOG_PREVIEW_SECRET;
    t.after(() => oldPreview === undefined ? delete process.env.BLOG_PREVIEW_SECRET : process.env.BLOG_PREVIEW_SECRET = oldPreview);
    const post = { _id: other, slug: 'draft-story' };
    assert.throws(() => verifyPreviewToken(jwt.sign({ role: 'preview', slug: post.slug }, 'wb_editorial_secret_2026')));
    const valid = signPreviewToken(post);
    assert.equal(verifyPreviewToken(valid).postId, other);
    assert.throws(() => verifyAccessToken(valid));
    delete process.env.JWT_SECRET_KEY;
    assert.throws(() => signPreviewToken(post), /not configured/);
});
