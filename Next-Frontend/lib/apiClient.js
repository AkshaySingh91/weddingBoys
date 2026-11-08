'use client';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Coalesce concurrent refreshes so a burst of 401s triggers exactly one call.
let refreshInFlight = null;

async function refreshSession() {
    if (!refreshInFlight) {
        refreshInFlight = fetch(`${api_url}/api/admin/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => { refreshInFlight = null; });
    }
    return refreshInFlight;
}

/**
 * Makes every admin API call survive an expired access token.
 *
 * The access token lives 15 minutes. Most admin screens call the API with plain
 * `fetch(..., { credentials: 'include' })`, not `apiFetch`, so after 15 idle
 * minutes their first request came back 401 and the screen showed
 * "Unauthorized" until a reload (the reload went through `/auth/me`, which
 * does refresh). The same happened on a cold load: children's effects run
 * before AdminAuthProvider's, so a page fetched with the stale token while the
 * session check was still refreshing it.
 *
 * Wrapping `window.fetch` once fixes every caller: a 401 from our API triggers
 * one shared refresh (concurrent 401s wait on the same call, so a rotating
 * refresh token is never spent twice) and the request is retried once. Auth
 * endpoints are excluded so login, refresh and logout behave as before.
 */
export function installAuthRefresh() {
    if (typeof window === 'undefined' || !api_url || window.fetch.__authRefresh) return;
    const original = window.fetch.bind(window);

    const wrapped = async (input, init) => {
        const url = typeof input === 'string' ? input : input?.url || String(input);
        const ours = url.startsWith(`${api_url}/api/`) && !url.startsWith(`${api_url}/api/admin/auth/`);
        if (!ours) return original(input, init);

        // A Request body can only be read once — keep a copy for the retry.
        const retryInput = input instanceof Request ? input.clone() : input;
        const res = await original(input, init);
        if (res.status !== 401) return res;

        const refreshed = await refreshSession();
        return refreshed ? original(retryInput, init) : res;
    };
    wrapped.__authRefresh = true;
    window.fetch = wrapped;
}

/**
 * Authenticated fetch against the admin API.
 * Always sends cookies, and transparently retries once after refreshing an
 * expired access token. Tokens themselves are HttpOnly and never touched here.
 */
export async function apiFetch(path, options = {}) {
    const url = path.startsWith('http') ? path : `${api_url}${path}`;
    const init = {
        ...options,
        credentials: 'include',
        headers: {
            ...(options.body && !(options.body instanceof FormData)
                ? { 'Content-Type': 'application/json' }
                : {}),
            ...(options.headers || {}),
        },
    };

    let res = await fetch(url, init);

    if (res.status === 401) {
        const refreshed = await refreshSession();
        if (refreshed) {
            res = await fetch(url, init);
        }
    }
    return res;
}

/** apiFetch + JSON parsing. Throws with the server's message on failure. */
export async function apiJson(path, options = {}) {
    const res = await apiFetch(path, options);
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
        throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
    }
    return data;
}

export { api_url };
