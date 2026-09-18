// lib/analytics/tracker.js
// Client-side, cookieless, privacy-preserving event tracker for editorial stories.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getTodayString() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Dispatch an analytics event with non-blocking fetch (fire & forget).
 */
async function sendEvent(slug, type, extra = {}) {
    if (typeof window === 'undefined' || !slug) return;

    try {
        const url = `${API_BASE}/api/blogs/${encodeURIComponent(slug)}/view`;
        const payload = JSON.stringify({ type, ...extra });

        // Prefer sendBeacon if available for reliable background dispatch on page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon(url, blob);
        } else {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: payload,
                keepalive: true
            }).catch(() => {});
        }
    } catch {
        // Silently discard any network tracking issues
    }
}

/**
 * Track page view with ephemeral session deduplication.
 */
export function trackBlogView(slug) {
    if (typeof window === 'undefined' || !slug) return;

    try {
        const today = getTodayString();
        const sessionKey = `twb_view_${slug}_${today}`;
        const hasViewed = sessionStorage.getItem(sessionKey);

        const isUnique = !hasViewed;
        if (isUnique) {
            sessionStorage.setItem(sessionKey, '1');
        }

        sendEvent(slug, 'view', { isUnique });
    } catch {
        sendEvent(slug, 'view', { isUnique: false });
    }
}

/**
 * Track read completion when reader scrolls >= 90% of story content.
 */
export function trackBlogReadComplete(slug) {
    if (typeof window === 'undefined' || !slug) return;

    try {
        const sessionKey = `twb_read_${slug}`;
        if (sessionStorage.getItem(sessionKey)) return; // Already recorded for this session

        sessionStorage.setItem(sessionKey, '1');
        sendEvent(slug, 'read_complete');
    } catch {
        // Silently catch sessionStorage permissions/quota errors
    }
}

/**
 * Track enquiry CTA clicks inside story blocks.
 */
export function trackBlogCtaClick(slug) {
    if (typeof window === 'undefined' || !slug) return;
    sendEvent(slug, 'cta_click');
}
