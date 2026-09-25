/**
 * Labels for the server's visibility reasons (Backend/Services/portfolioVisibility.js).
 * An item is live only when it has none. The card shows the most actionable
 * reason; the tooltip lists all of them.
 */
const REASONS = {
    'asset-missing': { label: 'File missing', cls: 'bg-rose-600/90' },
    failed: { label: 'Processing failed', cls: 'bg-rose-600/90' },
    processing: { label: 'Processing', cls: 'bg-amber-500/90 animate-pulse' },
    'hidden-by-admin': { label: 'Hidden', cls: 'bg-studio-obsidian/85' },
    'wedding-archived': { label: 'Wedding archived', cls: 'bg-stone-500/90' },
    'wedding-draft': { label: 'Wedding is draft', cls: 'bg-stone-500/90' },
};
const ORDER = Object.keys(REASONS);

export const REASON_TEXT = {
    'asset-missing': 'its file was deleted',
    failed: 'processing failed',
    processing: 'the file is still processing',
    'hidden-by-admin': 'you hid it',
    'wedding-archived': 'the wedding is archived',
    'wedding-draft': 'the wedding is not published',
};

/** { label, cls, title } for an item's chip, or null if the server sent no visibility. */
export function visibilityChip(item) {
    const v = item?.visibility;
    if (!v) return null;
    if (v.public) return { label: 'Live', cls: 'bg-emerald-600/90', title: 'Visible on the public site' };
    const top = ORDER.find((r) => v.reasons.includes(r)) || v.reasons[0];
    return {
        label: REASONS[top]?.label || top,
        cls: REASONS[top]?.cls || 'bg-studio-obsidian/85',
        title: `Not on the site: ${v.reasons.map((r) => REASON_TEXT[r] || r).join(' · ')}`,
    };
}
