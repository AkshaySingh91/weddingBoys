import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

export const RECOVERY_CODE_COUNT = 10;

// Crockford-style alphabet: no O/0/I/1 so codes can't be mis-transcribed.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8; // rendered as XXXX-XXXX

/** Random 8-char code, displayed grouped as `A8K2-9P3L`. */
function makeCode() {
    const bytes = crypto.randomBytes(CODE_LENGTH);
    let out = '';
    for (let i = 0; i < CODE_LENGTH; i += 1) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/** `count` unique display codes. */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT) {
    const codes = new Set();
    while (codes.size < count) codes.add(makeCode());
    return [...codes];
}

/**
 * Strip formatting so users can type `a8k2 9p3l`, `A8K29P3L` or `A8K2-9P3L`
 * interchangeably. Hashes are always computed over this normalized form.
 */
export function normalizeRecoveryCode(input = '') {
    return String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Hash display codes for storage as [{ codeHash, usedAt }]. */
export async function hashRecoveryCodes(codes) {
    const salt = await bcrypt.genSalt(10);
    return Promise.all(
        codes.map(async (code) => ({
            codeHash: await bcrypt.hash(normalizeRecoveryCode(code), salt),
            usedAt: null,
        })),
    );
}

/**
 * Find the index of the unused entry matching `input`, or -1.
 * Every unused hash is checked (no early return) so timing does not reveal
 * which slot matched.
 */
export async function findRecoveryCodeIndex(entries = [], input) {
    const normalized = normalizeRecoveryCode(input);
    if (!normalized) return -1;

    let matchIndex = -1;
    for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        if (entry.usedAt) continue;
        // eslint-disable-next-line no-await-in-loop
        const ok = await bcrypt.compare(normalized, entry.codeHash);
        if (ok && matchIndex === -1) matchIndex = i;
    }
    return matchIndex;
}
