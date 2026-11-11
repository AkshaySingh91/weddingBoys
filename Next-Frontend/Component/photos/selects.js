'use client';

/**
 * Your selects — the photographs a visitor marked, kept in this browser
 * (localStorage, no login) and shared as a link: /photos/selects?ids=a,b,c.
 * Like a photographer's contact sheet, a "select" is a frame circled in red.
 *
 * One store for the page (useSyncExternalStore), synced across tabs by the
 * storage event. Each entry keeps what the tray needs to draw a thumbnail
 * without asking the server: { id, src, a }.
 */
import { useCallback, useSyncExternalStore } from 'react';

const KEY = 'twv.selects.v1';
const MAX = 60;
const EMPTY = [];
let cache = null;
const subs = new Set();

function read() {
    if (cache) return cache;
    try {
        const raw = JSON.parse(window.localStorage.getItem(KEY) || '[]');
        cache = Array.isArray(raw) ? raw.filter((x) => x && typeof x.id === 'string').slice(0, MAX) : EMPTY;
    } catch {
        cache = EMPTY;
    }
    return cache;
}
function write(next) {
    cache = next;
    try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: this tab only */ }
    subs.forEach((f) => f());
}
function subscribe(fn) {
    subs.add(fn);
    const onStorage = (e) => { if (e.key === KEY) { cache = null; fn(); } };
    window.addEventListener('storage', onStorage);
    return () => { subs.delete(fn); window.removeEventListener('storage', onStorage); };
}

export function useSelects() {
    const list = useSyncExternalStore(subscribe, read, () => EMPTY);
    const has = useCallback((id) => list.some((x) => x.id === id), [list]);
    const toggle = useCallback((entry) => {
        const cur = read();
        const on = cur.some((x) => x.id === entry.id);
        write(on ? cur.filter((x) => x.id !== entry.id) : [{ id: entry.id, src: entry.src, a: entry.a }, ...cur].slice(0, MAX));
        return !on;
    }, []);
    const remove = useCallback((id) => write(read().filter((x) => x.id !== id)), []);
    const clear = useCallback(() => write(EMPTY), []);
    return { list, has, toggle, remove, clear };
}

export const selectsHref = (list) => `/photos/selects?ids=${list.map((x) => x.id).join(',')}`;
