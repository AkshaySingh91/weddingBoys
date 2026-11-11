import { NextResponse } from 'next/server';

/**
 * Subdomain routing + edge route protection.
 *
 * Nginx points BOTH theweddingvachan.com and admin.theweddingvachan.com at this same
 * Next.js instance, so the admin surface is separated here at the edge:
 *
 *   admin.theweddingvachan.com/login  ->  rewrite to  /admin/login   (URL unchanged)
 *   admin.theweddingvachan.com/blogs  ->  rewrite to  /admin/blogs
 *
 * NOTE: In Next.js 16 the `middleware` file convention is deprecated and
 * renamed to `proxy` — hence this file is `proxy.js` exporting `proxy()`.
 */

// Paths (relative to the admin root) reachable without a session.
// Self-service signup is gone — onboarding is invite-only.
const PUBLIC_ADMIN_PATHS = [
    '/login',
    '/forgot-password',
    '/reset-password',
    '/accept-invite',
];

// Cookies that indicate a session exists. Presence only — the real
// verification happens on the API against the signed/HttpOnly value.
// Production uses the `__Secure-` prefix; dev drops it (no HTTPS locally).
const AUTH_COOKIES = ['__Secure-admin-token', 'admin-token', '__Secure-admin-refresh', 'admin-refresh'];

const isAdminHost = (host = '') => {
    const name = host.split(':')[0].toLowerCase();
    return name === 'admin.theweddingvachan.com' || name.startsWith('admin.');
};

/**
 * Local development on a *.localhost host (e.g. admin.localhost:3000).
 *
 * The API and the frontend are different origins in dev, and a cookie set by
 * `localhost:8080` cannot be reliably shared with `admin.localhost`: omitting
 * the Domain attribute makes it host-only, and `Domain=localhost` is a
 * single-label domain that not every HTTP client honours across subdomains.
 *
 * The practical consequence was that signing in on admin.localhost:3000
 * appeared to do nothing — the password and TOTP were accepted and the cookies
 * were set, but this gate could not see them, so the next navigation bounced
 * straight back to /admin/login.
 *
 * The gate is a UX affordance, not a security boundary (every admin API call is
 * verified server-side by `verifyToken`), so on a dev host we skip the bounce
 * and let AdminAuthProvider decide. It calls /api/admin/auth/me against the API
 * host, where the cookie IS in scope regardless of which frontend host is used,
 * and redirects to the login screen itself if there is no session.
 *
 * Production hosts never match this, so the gate is unchanged there.
 */
const isLocalDevHost = (host = '') =>
    host.split(':')[0].toLowerCase().endsWith('.localhost');

/**
 * Story pages: decide the status before any HTML streams.
 *
 * The (site) segment has a loading UI, so a page's response starts streaming
 * with 200 before the page itself runs — `notFound()` and `permanentRedirect()`
 * inside it can no longer change the status (next/dist/docs … loading.md,
 * "Status Codes"). The docs' remedy is a fast check here: a missing story is a
 * real 404 and an old slug a real 308, which is what search engines need.
 * A 30 s memo keeps it to one small API call per story per half-minute; on any
 * error the request simply continues and the page decides as before.
 */
const STORY_PATH = /^\/weddings\/story\/([^/]+)\/?$/;
const storyMemo = new Map();
async function storyStatus(slug) {
    const hit = storyMemo.get(slug);
    if (hit && Date.now() - hit.at < 30_000) return hit.value;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/weddings/${encodeURIComponent(slug)}/status`, { signal: AbortSignal.timeout(1500) });
        const value = res.status === 404 ? { status: 'missing' } : res.ok ? await res.json() : null;
        if (value) storyMemo.set(slug, { at: Date.now(), value });
        if (storyMemo.size > 500) storyMemo.delete(storyMemo.keys().next().value);
        return value;
    } catch {
        return null;
    }
}

async function mediaStatus(kind, id) {
    const key = `${kind}:${id}`;
    const hit = storyMemo.get(key);
    if (hit && Date.now() - hit.at < 30000) return hit.value;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${kind}/${encodeURIComponent(id)}/status`, { signal: AbortSignal.timeout(1500) });
        const value = res.status === 404 ? { status: 'missing' } : res.ok ? { status: 'found' } : null;
        if (value) storyMemo.set(key, { at: Date.now(), value });
        if (storyMemo.size > 500) storyMemo.delete(storyMemo.keys().next().value);
        return value;
    } catch { return null; }
}

export async function proxy(request) {
    const host = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;

    // Only an item id (24 hex) is checked: /photos/selects is a page of its own.
    const media = pathname.match(/^\/(films|photos)\/([0-9a-f]{24})\/?$/i);
    if (media && !isAdminHost(host)) {
        const status = await mediaStatus(media[1] === 'films' ? 'videos' : 'photos', media[2]);
        if (status?.status === 'missing') return NextResponse.rewrite(request.nextUrl, { status: 404 });
        return NextResponse.next();
    }

    const story = pathname.match(STORY_PATH);
    if (story && !isAdminHost(host)) {
        const found = await storyStatus(decodeURIComponent(story[1]).toLowerCase());
        if (found?.status === 'moved') {
            return NextResponse.redirect(new URL(`/weddings/story/${found.slug}`, request.url), 308);
        }
        if (found?.status === 'missing') {
            // The page renders its not-found UI; the status is set here, before streaming.
            return NextResponse.rewrite(request.nextUrl, { status: 404 });
        }
        return NextResponse.next();
    }

    // Non-admin host: serve the public marketing site untouched.
    if (!isAdminHost(host)) {
        return NextResponse.next();
    }

    // The "logical" path as the admin subdomain sees it (no /admin prefix).
    const logical = pathname.startsWith('/admin')
        ? (pathname.slice('/admin'.length) || '/')
        : pathname;

    const isPublic = PUBLIC_ADMIN_PATHS.some(
        (p) => logical === p || logical.startsWith(`${p}/`),
    );

    const hasSession = AUTH_COOKIES.some((c) => request.cookies.has(c));

    // Gate everything that isn't an auth screen — except on a *.localhost dev
    // host, where the cookie cannot be shared across origins (see above).
    if (!isPublic && !hasSession && !isLocalDevHost(host)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.search = logical && logical !== '/' ? `?next=${encodeURIComponent(logical)}` : '';
        return NextResponse.redirect(url);
    }

    // Map the subdomain path onto the /admin route tree without changing the URL.
    if (!pathname.startsWith('/admin')) {
        const url = request.nextUrl.clone();
        url.pathname = `/admin${pathname === '/' ? '/dashboard' : pathname}`;
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();
}

export const config = {
    // Skip API routes, Next internals and anything with a file extension so
    // CSS/JS/images are never caught by the auth gate.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
