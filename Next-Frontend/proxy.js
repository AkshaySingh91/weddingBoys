import { NextResponse } from 'next/server';

/**
 * Subdomain routing + edge route protection.
 *
 * Nginx points BOTH theweddingboys.in and admin.theweddingboys.in at this same
 * Next.js instance, so the admin surface is separated here at the edge:
 *
 *   admin.theweddingboys.in/login  ->  rewrite to  /admin/login   (URL unchanged)
 *   admin.theweddingboys.in/blogs  ->  rewrite to  /admin/blogs
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
const AUTH_COOKIES = ['__Secure-admin-token', 'admin-token'];

const isAdminHost = (host = '') => {
    const name = host.split(':')[0].toLowerCase();
    return name === 'admin.theweddingboys.in' || name.startsWith('admin.');
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

export function proxy(request) {
    const host = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;

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

    // Signed-in users shouldn't sit on the login screen.
    if (isPublic && hasSession && logical === '/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        url.search = '';
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
