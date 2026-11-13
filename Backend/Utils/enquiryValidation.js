import { z } from 'zod';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a valid event date')
    .refine((s) => Number.isFinite(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s, 'Choose a valid event date');

export function normalizeContact(value) {
    const text = value.trim();
    if (z.email().safeParse(text).success) return text.toLowerCase();
    const digits = text.replace(/[\s()+.-]/g, '');
    if (/^\d{10}$/.test(digits)) return `+91${digits}`;
    if (/^91\d{10}$/.test(digits)) return `+${digits}`;
    return null;
}

const text = (max) => z.string().trim().max(max).optional().default('');

/*
 * The invitation (/contact). Only a name and a way to reply are required: a
 * partner's name, an exact date, a city are all welcome but never in the way.
 * Older clients sending bride/groom/eventDate still validate.
 *   eventDate  an exact day (start, optional end)            — or —
 *   dateNote   "December 2026" / "Not fixed yet"
 *   kind       wedding, pre-wedding shoot, engagement…
 *   source     the button that brought them ("film", "selects", "header"…)
 *   context    what they were looking at (a film's couple, selects link…)
 *   channel    form | whatsapp (a lead saved as they opened WhatsApp)
 */
export const enquirySchema = z.object({
    bride: z.string().trim().min(1, 'Enter your name').max(120),
    groom: text(120),
    contact: z.string().trim().min(1, 'Enter a phone number or email').max(254)
        .transform(normalizeContact).refine(Boolean, 'Enter a valid email or Indian phone number'),
    reach: text(200),
    eventDate: z.object({ start: date.optional().or(z.literal('')), end: date.optional().or(z.literal('')) }).optional()
        .transform((v) => (v?.start ? { start: v.start, end: v.end || v.start } : null))
        .refine((v) => !v || v.end >= v.start, 'The end date must be on or after the start date'),
    dateNote: text(40),
    kind: text(60),
    city: text(80),
    source: text(160),
    context: text(600),
    message: text(1000),
    channel: z.enum(['form', 'whatsapp']).optional().default('form'),
    // the invitation's look, and the frames they circled (both feed the partner's invitation)
    grade: z.enum(['ivory', 'haldi', 'mehendi', 'sangeet', 'pheras', 'reception']).optional().default('ivory'),
    selects: z.array(z.string().regex(/^[0-9a-f]{24}$/i)).max(30).optional().default([]),
});

export const escapeEmailHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
