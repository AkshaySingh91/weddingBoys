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
