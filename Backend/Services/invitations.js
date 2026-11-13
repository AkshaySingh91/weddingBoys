/**
 * Invitations (see Models/InvitationSchema.js).
 *
 *   createInvitation   made with an enquiry from /contact; returns its code
 *   pickPhotos         the studio's best photographs for it, chosen once:
 *                      the couple's own selects first, then the light's
 *                      ceremony (~60%), then the rest of the day; spotlight /
 *                      priority order; at most 2 per wedding
 *   publicInvitation   what the partner's page shows (no contact, no note)
 */
import { randomInt } from 'node:crypto';
import mongoose from 'mongoose';
import Invitation, { INVITE_GRADES } from '../Models/InvitationSchema.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import { PUBLIC_GATE } from './portfolioVisibility.js';
import { toLegacyPhotoRow } from './portfolioService.js';

const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'; // no 0/O, 1/I/L, U
const DAYS = 120;
const N = 16;
const CEREMONY = { haldi: 'Haldi', mehendi: 'Mehendi', sangeet: 'Sangeet', pheras: 'Wedding / Pheras', reception: 'Reception', ivory: null };
const ARC = ['Pre-Wedding', 'Engagement', 'Mehendi', 'Haldi', 'Sangeet', 'Wedding / Pheras', 'Reception'];

export const newCode = () => Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
/** Names shown on the studio's domain: letters, spaces and . ' - only. */
export const cleanName = (s) => {
    if (typeof s !== 'string') return '';
    const t = s.trim();
    // a web address is not a name ("www.x.com", "x.in"): a dot straight between letters, or www/http
    if (!/^[\p{L}\p{M} .'-]{1,40}$/u.test(t) || /\p{L}\.\p{L}/u.test(t) || /\b(www|https?)\b/i.test(t)) return '';
    return t;
};
const cleanCity = (s) => (typeof s === 'string' && s.trim().length <= 40 && !/[/:@<>]|www\.|\.(com|in|net)\b/i.test(s) ? s.trim() : '');
const score = (i) => Number(i.spotlight) || Number(i.generalPriority) || 0;

export async function pickPhotos({ grade = 'ivory', selects = [] } = {}) {
    const items = await PortfolioItem.find({ kind: 'Photo', ...PUBLIC_GATE }, { eventGroup: 1, client: 1, spotlight: 1, generalPriority: 1 }).lean();
    const byId = new Map(items.map((i) => [String(i._id), i]));
    items.sort((a, b) => score(b) - score(a) || String(a._id).localeCompare(String(b._id)));
    const out = [];
    const perWedding = new Map();
    const take = (i, cap = 2) => {
        const w = String(i.client || '');
        if (out.some((x) => String(x._id) === String(i._id)) || (perWedding.get(w) || 0) >= cap) return false;
        perWedding.set(w, (perWedding.get(w) || 0) + 1);
        out.push(i);
        return true;
    };
    for (const id of selects) { const i = byId.get(String(id)); if (i && out.length < N) take(i, 99); }
    const ceremony = CEREMONY[grade];
    if (ceremony) for (const i of items) { if (out.length >= Math.round(N * 0.6)) break; if (i.eventGroup === ceremony) take(i); }
    // the rest of the day, round-robin across ceremonies in the order they happen
    const queues = ARC.map((c) => items.filter((i) => i.eventGroup === c));
    for (let round = 0; out.length < N && round < 40; round += 1) {
        let added = false;
        for (const q of queues) { const next = q.find((i) => !out.includes(i) && (perWedding.get(String(i.client || '')) || 0) < 2); if (next && out.length < N) { take(next); added = true; } }
        if (!added) break;
    }
    for (const i of items) { if (out.length >= N) break; take(i, 3); }
    return out.map((i) => i._id);
}

export async function createInvitation({ enquiryId = null, details, grade, selects = [] }) {
    const g = INVITE_GRADES.includes(grade) ? grade : 'ivory';
    const a = cleanName(details.bride);
    if (!a) return null;
    const photoIds = await pickPhotos({ grade: g, selects: selects.filter((x) => mongoose.isValidObjectId(x)) });
    const when = details.eventDate?.start ? details.eventDate.start : (details.dateNote || '');
    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            const doc = await Invitation.create({
                code: newCode(), enquiry: enquiryId, names: { a, b: cleanName(details.groom) }, kind: String(details.kind || '').slice(0, 60),
                when: String(when).slice(0, 40), city: cleanCity(details.city), grade: g, photoIds,
                expiresAt: new Date(Date.now() + DAYS * 86400000),
            });
            return doc;
        } catch (e) {
            if (e.code !== 11000) throw e; // a code collision: try another
        }
    }
    return null;
}

export async function publicInvitation(code) {
    if (!/^[2-9A-HJKMNP-TV-Z]{8}$/.test(String(code || ''))) return null;
    const inv = await Invitation.findOneAndUpdate(
        { code, status: 'active', expiresAt: { $gt: new Date() } },
        { $inc: { 'views.count': 1 } },
        { new: true },
    ).lean();
    if (!inv) return null;
    if (!inv.views.firstAt) await Invitation.updateOne({ _id: inv._id, 'views.firstAt': null }, { $set: { 'views.firstAt': new Date() } });
    const items = await PortfolioItem.find({ _id: { $in: inv.photoIds }, kind: 'Photo', ...PUBLIC_GATE })
        .populate('client', 'clientName location celebrationDates weddingDate slug').lean();
    const byId = new Map(items.map((i) => [String(i._id), i]));
    return {
        code: inv.code, names: inv.names, kind: inv.kind, when: inv.when, city: inv.city, grade: inv.grade,
        photos: inv.photoIds.map((id) => byId.get(String(id))).filter(Boolean).map(toLegacyPhotoRow),
    };
}

export async function recordReply(code, circled) {
    const inv = await Invitation.findOne({ code, status: 'active', expiresAt: { $gt: new Date() } });
    if (!inv) return null;
    if (inv.reply.edits >= 5) return 'limit';
    const allowed = new Set(inv.photoIds.map(String));
    inv.reply = { circled: [...new Set(circled.map(String))].filter((id) => allowed.has(id)), at: new Date(), edits: inv.reply.edits + 1 };
    await inv.save();
    return inv.reply.circled.length;
}
