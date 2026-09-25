/**
 * Storage guard — keeps a non-production environment from touching production files.
 *
 * Dev runs against a COPY of the production database, and that copy's Media
 * records point at production objects in the one shared R2 bucket. Without a
 * guard, purging a test wedding locally deletes real photographs, and a dev
 * worker re-processing a copied job overwrites production renditions.
 *
 * Set `STORAGE_KEY_PREFIX=dev` in a non-production `.env`:
 *   - every new key is built under `dev/…`;
 *   - writing outside the prefix THROWS (loud: it is always a bug or a copied record);
 *   - deleting outside the prefix is REFUSED with a warning (quiet: the calling flow,
 *     e.g. "delete wedding and purge files", still completes its database work).
 *
 * Production leaves the variable unset, so nothing here changes its behaviour.
 */
/**
 * Read on every call, never cached at import. ES module imports are hoisted, so
 * a value captured at module evaluation can predate `dotenv.config()` — and an
 * empty prefix means an UNGUARDED dev environment, silently.
 *
 * @returns {string} `'dev/'`, or `''` when unguarded (production).
 */
export function storagePrefix() {
    const raw = (process.env.STORAGE_KEY_PREFIX || '').trim().replace(/^\/+|\/+$/g, '');
    return raw ? `${raw}/` : '';
}

export const isStorageGuarded = () => Boolean(storagePrefix());

/** Prefix a freshly built key. Idempotent. */
export function withStoragePrefix(key) {
    const prefix = storagePrefix();
    if (!prefix || !key || key.startsWith(prefix)) return key;
    return `${prefix}${key}`;
}

const inScope = (key) => {
    const prefix = storagePrefix();
    return !prefix || (typeof key === 'string' && key.startsWith(prefix));
};

/** Call before any PUT / multipart create / presign. Throws outside the prefix. */
export function assertWritableKey(key, op = 'write') {
    if (inScope(key)) return;
    throw new Error(
        `[storage-guard] refused ${op} to "${key}": outside STORAGE_KEY_PREFIX "${storagePrefix()}". `
        + 'This environment must not write production objects.',
    );
}

/** Call before any delete. Returns false (and logs) when the delete must be skipped. */
export function canDeleteKey(key, op = 'delete') {
    if (inScope(key)) return true;
    console.warn(`[storage-guard] skipped ${op} of "${key}": outside STORAGE_KEY_PREFIX "${storagePrefix()}".`);
    return false;
}
