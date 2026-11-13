import express from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { rateLimit } from '../../Middleware/rateLimit.js';
import { publicInvitation, recordReply } from '../../Services/invitations.js';
import Invitation from '../../Models/InvitationSchema.js';

/*
 * /invite/<code> — the invitation a couple sent their partner.
 * Uniform 404 for missing, expired and revoked codes (no enumeration signal).
 */
const router = express.Router();
const SITE = (process.env.PUBLIC_SITE_URL || 'https://theweddingvachan.com').replace(/\/$/, '');
const noIndex = (res) => res.set({ 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'strict-origin' });

// For the site's proxy: does this code open? (no view is counted)
router.get('/api/invites/:code/status', rateLimit({ limit: 120, windowMs: 60 * 1000 }), async (req, res) => {
    const code = String(req.params.code || '');
    const ok = /^[2-9A-HJKMNP-TV-Z]{8}$/.test(code)
        && await Invitation.exists({ code, status: 'active', expiresAt: { $gt: new Date() } });
    noIndex(res);
    return ok ? res.json({ status: 'found' }) : res.status(404).json({ status: 'missing' });
});

router.get('/api/invites/:code', rateLimit({ limit: 120, windowMs: 60 * 1000 }), async (req, res) => {
    try {
        const inv = await publicInvitation(req.params.code);
        noIndex(res);
        if (!inv) return res.status(404).json({ message: 'This invitation is not available' });
        res.set('Cache-Control', 'private, no-store');
        return res.json({ invitation: inv });
    } catch (error) {
        console.error('GET /api/invites error:', error.message);
        return res.status(500).json({ message: 'Could not open the invitation' });
    }
});

const replySchema = z.object({ circled: z.array(z.string().regex(/^[0-9a-f]{24}$/i)).max(20) });
router.post('/api/invites/:code/reply', rateLimit({ limit: 5, windowMs: 60 * 60 * 1000 }), async (req, res) => {
    const parsed = replySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Choose up to 20 photographs' });
    try {
        const n = await recordReply(String(req.params.code || ''), parsed.data.circled);
        if (n === null) return res.status(404).json({ message: 'This invitation is not available' });
        if (n === 'limit') return res.status(429).json({ message: 'These circles have been changed too many times' });
        return res.json({ circled: n });
    } catch (error) {
        console.error('POST /api/invites/reply error:', error.message);
        return res.status(500).json({ message: 'Could not save your circles' });
    }
});

// A QR code for the invitation link (desktop: scan it to send from your phone).
router.get('/api/invites/:code/qr.png', rateLimit({ limit: 60, windowMs: 60 * 1000 }), async (req, res) => {
    const code = String(req.params.code || '');
    if (!/^[2-9A-HJKMNP-TV-Z]{8}$/.test(code)) return res.status(404).end();
    const png = await QRCode.toBuffer(`${SITE}/invite/${code}`, { margin: 1, width: 360, color: { dark: '#33161AFF', light: '#FFFFFFFF' } });
    noIndex(res);
    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400, immutable' });
    return res.end(png);
});

export default router;
