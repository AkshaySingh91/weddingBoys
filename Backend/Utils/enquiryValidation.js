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

export const enquirySchema = z.object({
    bride: z.string().trim().min(1, "Enter the bride's name").max(120),
    groom: z.string().trim().min(1, "Enter the groom's name").max(120),
    contact: z.string().trim().min(1, 'Enter a phone number or email').max(254)
        .transform(normalizeContact).refine(Boolean, 'Enter a valid email or Indian phone number'),
    reach: z.string().trim().max(200).optional().default(''),
    eventDate: z.object({ start: date, end: date.optional().or(z.literal('')) })
        .transform((value) => ({ start: value.start, end: value.end || value.start }))
        .refine((value) => value.end >= value.start, 'The end date must be on or after the start date'),
});

export const escapeEmailHtml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));
