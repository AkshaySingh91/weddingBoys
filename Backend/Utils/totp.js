import {
    generateSecret as otpGenerateSecret,
    generateURI,
    verify as otpVerify,
    NobleCryptoPlugin,
    ScureBase32Plugin,
} from 'otplib';

// otplib v13 requires explicit crypto/base32 plugins — there is no
// pre-configured `authenticator` singleton like in v12 and earlier.
const crypto = new NobleCryptoPlugin();
const base32 = new ScureBase32Plugin();

const ISSUER = 'The Wedding Vachan';

// Accept codes from the adjacent 30s steps to absorb clock drift between the
// server and the user's phone.
const EPOCH_TOLERANCE = 30;

/** Base32 secret to store against the admin. */
export async function generateTotpSecret() {
    return otpGenerateSecret({ crypto, base32 });
}

/** otpauth:// URI that authenticator apps consume from a QR code. */
export function buildOtpAuthUrl(email, secret) {
    return generateURI({ type: 'totp', secret, label: email, issuer: ISSUER });
}

/**
 * Verify a 6-digit code.
 *
 * NOTE: otplib's verify() resolves to an OBJECT ({ valid, delta, ... }), not a
 * boolean — truthiness checks on it would always pass and silently defeat MFA.
 * This wrapper collapses it to a real boolean so callers cannot get that wrong.
 */
export async function verifyTotp(token, secret) {
    if (!token || !secret) return false;
    try {
        const result = await otpVerify({
            token, secret, crypto, base32, epochTolerance: EPOCH_TOLERANCE,
        });
        return result?.valid === true;
    } catch {
        // Malformed token/secret should read as "invalid", never as an error.
        return false;
    }
}
