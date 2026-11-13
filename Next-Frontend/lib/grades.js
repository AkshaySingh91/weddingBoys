/**
 * Ceremony grades — each ritual's own light (r g b), shared by the wedding
 * story's Scene Grade and the photographs gallery. A colour set on the
 * ceremony tag in admin (hex) wins; a named tag colour ("amber") does not.
 */
export const GRADES = {
    haldi: '232 170 40', mehendi: '112 128 60', mehndi: '112 128 60', sangeet: '120 70 130', cocktail: '120 70 130',
    engagement: '201 162 39', tilak: '201 162 39', 'pre-wedding': '201 162 39',
    wedding: '217 52 42', 'wedding-pheras': '217 52 42', pheras: '217 52 42', reception: '51 22 26',
};
export const GOLD = '201 162 39';

export const hexToRgb = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** { key?, label?, color? } → "r g b" */
export const gradeOf = (c = {}) => hexToRgb(c.color) || GRADES[c.key]
    || GRADES[String(c.label || '').toLowerCase().split(/[\s/]+/)[0]] || GOLD;

/** Ink or ivory text, whichever reads on this grade. */
export const inkOn = (rgb) => {
    const [r, g, b] = rgb.split(' ').map(Number);
    return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? 'rgb(51 22 26)' : 'rgb(255 250 244)';
};

/**
 * The invitation's lights (/contact, /invite): each a ceremony's colour used as
 * light, foil and a hairline motif — never a fill. Text always stays ink.
 */
export const INVITE_LOOKS = [
    { key: 'ivory', label: 'Ivory', rgb: GOLD, ceremony: null },
    { key: 'haldi', label: 'Haldi', rgb: GRADES.haldi, ceremony: 'Haldi' },
    { key: 'mehendi', label: 'Mehendi', rgb: GRADES.mehendi, ceremony: 'Mehendi' },
    { key: 'sangeet', label: 'Sangeet', rgb: GRADES.sangeet, ceremony: 'Sangeet' },
    { key: 'pheras', label: 'Pheras', rgb: GRADES.wedding, ceremony: 'Wedding / Pheras' },
    { key: 'reception', label: 'Reception', rgb: GRADES.reception, ceremony: 'Reception' },
];
export const lookOf = (key) => INVITE_LOOKS.find((l) => l.key === key) || INVITE_LOOKS[0];
/** The light that fits a ceremony label ("Wedding / Pheras" → pheras). */
export const lookForCeremony = (label) => INVITE_LOOKS.find((l) => l.ceremony && l.ceremony.toLowerCase() === String(label || '').toLowerCase())?.key || 'ivory';
