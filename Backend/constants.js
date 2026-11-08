const IS_PROD = process.env.NODE_ENV === 'production';

/**
 * Cookie names.
 *
 * In production we use the `__Secure-` prefix: the browser refuses to accept
 * such a cookie unless it was set with `Secure` over HTTPS, which blocks a
 * network attacker from injecting one over plain HTTP.
 *
 * We deliberately do NOT use `__Host-`: that prefix forbids the `Domain`
 * attribute, which would scope the cookie to the single host that set it (the
 * API). The Next.js edge proxy runs on admin.theweddingvachan.com and must be able
 * to READ this cookie to gate routes, so the cookie has to be domain-scoped to
 * `.theweddingvachan.com`. `__Host-` is therefore incompatible with this
 * architecture; `__Secure-` gives us the prefix protection that is compatible.
 *
 * The prefix is dropped outside production because local dev runs over http.
 */
export const COOKIE_NAME = {
    // Short-lived access token, sent on every authenticated request.
    access_token: IS_PROD ? '__Secure-admin-token' : 'admin-token',
    // Long-lived refresh token, matched against a Session document.
    refresh_token: IS_PROD ? '__Secure-admin-refresh' : 'admin-refresh',
    // Retained ONLY so logout can clear any stale pre-migration cookie.
    legacy_session_token: 'session-token',
}

export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    EDITOR: 'Editor',
    PORTFOLIO_MANAGER: 'PortfolioManager',
};

export const ALL_ROLES = Object.values(ROLES);

// Token lifetimes
export const ACCESS_TOKEN_TTL = '15m';
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_DAYS = 30;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// Brute-force mitigation
export const MAX_FAILED_LOGINS = 5;
export const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

// Window in which a half-authenticated user must submit their TOTP code.
export const MFA_TEMP_TOKEN_TTL = '5m';

/**
 * Cookie domain.
 *
 * The API sets the session cookie, but the Next.js edge proxy running on the
 * admin subdomain must be able to READ it to gate routes — so in production the
 * cookie is scoped to `.theweddingvachan.com`, shared by the API and
 * admin.theweddingvachan.com.
 *
 * Development deliberately sets NO domain, leaving the cookie host-only for
 * `localhost`. `Domain=localhost` is a single-label domain and clients disagree
 * about whether such a cookie may be shared with `admin.localhost` — some
 * refuse to send it, and a client that refuses to *store* it would break login
 * outright. That is too much risk on the auth path for a dev-only convenience.
 *
 * The admin subdomain works in dev regardless: the cookie is always in scope for
 * the API host (`localhost:8080`) whichever frontend host is used, so every
 * authenticated call succeeds, and `proxy.js` skips its cookie gate on
 * *.localhost hosts for exactly this reason.
 *
 * Set COOKIE_DOMAIN to override — e.g. COOKIE_DOMAIN=localhost to try sharing
 * across admin.localhost in a browser known to honour it, or a real dev domain
 * such as `.lvh.me` if you want dev to mirror production's subdomain scoping.
 */
export const cookieDomain = () => {
    if (process.env.COOKIE_DOMAIN !== undefined) {
        return process.env.COOKIE_DOMAIN || undefined;
    }
    return IS_PROD ? '.theweddingvachan.com' : undefined;
};

// Shared cookie options so every set/clear call stays in sync.
export const baseCookieOptions = () => {
    const domain = cookieDomain();
    return {
        httpOnly: true,
        ...(domain ? { domain } : {}),
        secure: IS_PROD,
        sameSite: 'lax',
        path: '/',
        signed: true,
    };
};
