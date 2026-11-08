import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import Admin from '../Models/adminSchema.js';
import Session from '../Models/Session.js';
import { deleteObject, getObjectUrl, putObjectUrl } from './awsController.js';
import { resolveNode } from '../Utils/mediaUrl.js';
import { signAccessToken, setAuthCookies, clearAuthCookies } from '../Utils/authTokens.js';
import { withStoragePrefix } from '../Services/storageGuard.js';

const detailsSchema = z.object({
    admin: z.object({
        id: z.string().optional(),
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().toLowerCase().email().max(254),
        phone: z.string().trim().max(20).optional().default(''),
        key: z.string().optional(),
        avatarMetaData: z.object({
            name: z.string().min(1).max(255),
            type: z.enum(['image/png', 'image/jpg', 'image/jpeg', 'image/webp']),
            size: z.number().int().positive().max(10 * 1024 * 1024),
        }).optional(),
    }),
    isAvatarUpdated: z.boolean(),
    currentPassword: z.string().max(1024).optional(),
});

function parseDetails(req, res) {
    // A submitted ID is only a consistency check, never the write target.
    if (req.body?.admin?.id && req.body.admin.id !== String(req.user.id)) {
        res.status(403).json({ message: 'You can only edit your own profile' });
        return null;
    }
    const parsed = detailsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: parsed.error.issues[0].message });
        return null;
    }
    const phone = parsed.data.admin.phone.replace(/[\s()-]/g, '');
    if (phone && !/^\+91\d{10}$/.test(phone)) {
        res.status(400).json({ message: 'Use an Indian phone number with +91 and 10 digits' });
        return null;
    }
    parsed.data.admin.phone = phone;
    return parsed.data;
}

export async function getProfile(req, res) {
    try {
        const admin = await Admin.findById(req.user.id).lean();
        if (!admin) return res.status(404).json({ message: 'Account not found' });
        const avatar = await resolveNode(admin.avatar, getObjectUrl);
        return res.json({ adminDetail: {
            _id: String(admin._id), name: admin.name, email: admin.email,
            phone: admin.phone || '', avatar, mfaEnabled: admin.mfaEnabled,
        } });
    } catch {
        return res.status(500).json({ message: 'Could not load your profile' });
    }
}

export async function verifyProfile(req, res) {
    const data = parseDetails(req, res);
    if (!data) return;
    if (!data.isAvatarUpdated) return saveProfile(req, res);
    if (!data.admin.avatarMetaData) return res.status(400).json({ message: 'Avatar file details are required' });
    try {
        const type = data.admin.avatarMetaData.type;
        const key = withStoragePrefix(`admin/${req.user.id}/images/${randomUUID()}.${type.split('/')[1]}`);
        const putUrl = await putObjectUrl(key, type);
        return res.json({ putUrl, key });
    } catch {
        return res.status(503).json({ message: 'Avatar upload is unavailable. Try again later.' });
    }
}

export async function saveProfile(req, res) {
    const data = parseDetails(req, res);
    if (!data) return;
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ message: 'Account not found' });
        const emailChanged = admin.email !== data.admin.email;
        if (emailChanged && (!data.currentPassword || !await bcrypt.compare(data.currentPassword, admin.password))) {
            return res.status(403).json({ message: 'Enter your current password to change your email address' });
        }
        const oldKey = admin.avatar?.key;
        if (data.isAvatarUpdated) {
            const prefix = withStoragePrefix(`admin/${req.user.id}/images/`);
            if (!data.admin.key?.startsWith(prefix) || !/^[a-f0-9-]+\.(png|jpe?g|webp)$/.test(data.admin.key.slice(prefix.length))) {
                return res.status(400).json({ message: 'Upload an avatar for this account first' });
            }
            admin.avatar = { key: data.admin.key };
        }
        admin.name = data.admin.name;
        const [firstName, ...lastName] = admin.name.split(/\s+/);
        admin.firstName = firstName;
        admin.lastName = lastName.join(' ');
        admin.email = data.admin.email;
        admin.phone = data.admin.phone || undefined;
        if (emailChanged) {
            admin.passwordResetTokenHash = null;
            admin.passwordResetExpiresAt = null;
            admin.authVersion = (admin.authVersion || 0) + 1;
        }
        await admin.save();
        if (emailChanged) {
            await Session.updateMany({ userId: admin._id }, { isValid: false });
            clearAuthCookies(res);
        } else {
            setAuthCookies(res, { accessToken: signAccessToken(admin) });
        }
        // Save the new reference before removing the old file.
        if (data.isAvatarUpdated && oldKey && oldKey !== admin.avatar.key) {
            deleteObject(oldKey).catch((error) => console.warn('[profile] old avatar cleanup:', error.message));
        }
        return res.json({ message: 'Profile updated', requiresLogin: emailChanged });
    } catch (error) {
        return res.status(error.code === 11000 ? 409 : 500).json({
            message: error.code === 11000 ? 'Email or phone is already in use' : 'Could not save your profile',
        });
    }
}

export async function changePassword(req, res) {
    const parsed = z.object({
        currentPassword: z.string().min(1).max(1024),
        newPassword: z.string().min(8).max(128).regex(/[A-Za-z]/).regex(/\d/),
        confirmPassword: z.string(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Use at least 8 characters, including a letter and a number' });
    if (parsed.data.newPassword !== parsed.data.confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin || !await bcrypt.compare(parsed.data.currentPassword, admin.password)) {
            return res.status(403).json({ message: 'Current password is incorrect' });
        }
        admin.password = await bcrypt.hash(parsed.data.newPassword, 12);
        admin.authVersion = (admin.authVersion || 0) + 1;
        admin.passwordResetTokenHash = null;
        admin.passwordResetExpiresAt = null;
        await admin.save();
        await Session.updateMany({ userId: admin._id }, { isValid: false });
        clearAuthCookies(res);
        return res.json({ message: 'Password updated. Please sign in again.', requiresLogin: true });
    } catch {
        return res.status(500).json({ message: 'Could not change your password' });
    }
}
