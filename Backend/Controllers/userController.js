import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { z } from 'zod';
import Admin from '../Models/adminSchema.js';
import Session from '../Models/Session.js';
import InviteToken from '../Models/InviteToken.js';
import { ALL_ROLES, ROLES } from '../constants.js';
import { hashToken } from '../Utils/authTokens.js';
import { sendMail, adminInviteEmail } from '../Utils/mailer.js';

const zodFail = (res, error) => res.status(400).json({
    message: error.issues[0]?.message || 'Invalid request',
    errors: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
});

const inviteSchema = z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(ALL_ROLES),
});
const roleSchema = z.object({ role: z.enum(ALL_ROLES) });
const statusSchema = z.object({ status: z.enum(['Active', 'Suspended']) });

const publicUser = (a) => ({
    id: a._id,
    userId: a.userId,
    name: a.name,
    email: a.email,
    phone: a.phone,
    role: a.role,
    status: a.status,
    avatar: a.avatar,
    lastLoginAt: a.lastLoginAt,
    lastLoginIp: a.lastLoginIp,
    mfaEnabled: a.mfaEnabled,
    createdAt: a.createdAt,
});

// GET /api/admin/users?page=&limit=&search=&role=&status=
export async function listUsers(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
        const { search, role, status } = req.query;

        const query = {};
        if (role) query.role = role;
        if (status) query.status = status;
        if (search) {
            const rx = new RegExp(search.trim(), 'i');
            query.$or = [{ name: rx }, { email: rx }];
        }

        const total = await Admin.countDocuments(query);
        const users = await Admin.find(query)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit);

        return res.status(200).json({
            users: users.map(publicUser),
            page, limit, total,
            hasMore: page * limit < total,
        });
    } catch (error) {
        console.error('listUsers error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// POST /api/admin/users/invite   (SuperAdmin only)
export async function inviteUser(req, res) {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { email, role } = parsed.data;

    try {
        const existing = await Admin.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'A user with that email already exists' });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        await InviteToken.create({
            email: email.toLowerCase(),
            role,
            tokenHash: hashToken(rawToken),
            invitedBy: req.user?.id || null,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

        const inviteUrl = `${process.env.ADMIN_URL || 'https://admin.theweddingboys.in'}/accept-invite/${rawToken}`;

        const { subject, html, text } = adminInviteEmail({
            inviteUrl,
            role,
            invitedByName: req.user?.name,
        });
        const emailed = await sendMail({ to: email, subject, html, text });

        return res.status(201).json({
            message: emailed
                ? `Invitation emailed to ${email}`
                : `Invitation created for ${email}, but the email could not be sent — share the link manually.`,
            emailed,
            // Returned so a SuperAdmin can copy the link directly from the UI.
            inviteUrl,
        });
    } catch (error) {
        console.error('inviteUser error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// POST /api/admin/users/accept-invite   (public)
export async function acceptInvite(req, res) {
    const schema = z.object({
        token: z.string().min(10),
        name: z.string().min(2, 'Name is required'),
        password: z.string().min(8, 'Password must be at least 8 characters')
            .regex(/[A-Za-z]/, 'Password must contain a letter')
            .regex(/\d/, 'Password must contain a number'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { token, name, password } = parsed.data;

    try {
        const invite = await InviteToken.findOne({
            tokenHash: hashToken(token),
            acceptedAt: null,
            expiresAt: { $gt: new Date() },
        });
        if (!invite) return res.status(400).json({ message: 'Invitation is invalid or has expired' });

        const existing = await Admin.findOne({ email: invite.email });
        if (existing) return res.status(409).json({ message: 'Account already exists' });

        const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
        const admin = await Admin.create({
            name,
            email: invite.email,
            password: hashed,
            role: invite.role,
            status: 'Active',
        });

        invite.acceptedAt = new Date();
        await invite.save();

        return res.status(201).json({ message: 'Account created. Please log in.', user: publicUser(admin) });
    } catch (error) {
        console.error('acceptInvite error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/admin/users/:id/role   (SuperAdmin only)
export async function updateUserRole(req, res) {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'User not found' });

        // Don't allow removing the last SuperAdmin.
        if (target.role === ROLES.SUPER_ADMIN && parsed.data.role !== ROLES.SUPER_ADMIN) {
            const count = await Admin.countDocuments({ role: ROLES.SUPER_ADMIN });
            if (count <= 1) {
                return res.status(400).json({ message: 'Cannot demote the last SuperAdmin' });
            }
        }

        target.role = parsed.data.role;
        await target.save();
        return res.status(200).json({ message: 'Role updated', user: publicUser(target) });
    } catch (error) {
        console.error('updateUserRole error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/admin/users/:id/status   (SuperAdmin only)
export async function updateUserStatus(req, res) {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'User not found' });

        if (String(target._id) === String(req.user?.id)) {
            return res.status(400).json({ message: 'You cannot change your own status' });
        }
        if (target.role === ROLES.SUPER_ADMIN && parsed.data.status === 'Suspended') {
            const count = await Admin.countDocuments({ role: ROLES.SUPER_ADMIN, status: 'Active' });
            if (count <= 1) {
                return res.status(400).json({ message: 'Cannot suspend the last active SuperAdmin' });
            }
        }

        target.status = parsed.data.status;
        await target.save();

        // Suspending someone must kick them off every device immediately.
        if (parsed.data.status === 'Suspended') {
            await Session.updateMany({ userId: target._id }, { isValid: false });
        }

        return res.status(200).json({ message: `User ${parsed.data.status.toLowerCase()}`, user: publicUser(target) });
    } catch (error) {
        console.error('updateUserStatus error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// DELETE /api/admin/users/:id/sessions   (SuperAdmin only) — force logout everywhere
export async function revokeUserSessions(req, res) {
    try {
        const target = await Admin.findById(req.params.id);
        if (!target) return res.status(404).json({ message: 'User not found' });

        const result = await Session.updateMany({ userId: target._id, isValid: true }, { isValid: false });
        return res.status(200).json({
            message: 'All sessions revoked',
            revoked: result.modifiedCount ?? 0,
        });
    } catch (error) {
        console.error('revokeUserSessions error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
