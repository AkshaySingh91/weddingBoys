/**
 * Covers: choosing the best still from a film, and where the subject is.
 *
 * A film's cover used to be whatever frame sat 10% of the way in — often a
 * fade, a blur pan or a guest's back. `pickBestFrame` samples candidate frames
 * across the film (skipping the opening and closing titles), scores each, and
 * returns the time of the best one:
 *
 *   sharpness   sharp's Laplacian-based estimate — rejects motion blur / focus pulls
 *   exposure    mean luminance near the middle — rejects fades, blown skies
 *   detail      entropy — rejects flat frames (walls, sky, black)
 *   contrast    luminance spread
 *
 * `focalPoint` finds where the subject is (sharp's attention strategy: skin
 * tones, saturation, luminance) so a 9:16 phone crop or a 21:9 desktop crop of a
 * landscape cover keeps the couple in frame. Returned as fractions {x, y} for
 * CSS object-position.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

/** Score one candidate frame (JPEG buffer). Higher is better; null = reject. */
export async function scoreFrame(buf) {
    const s = await sharp(buf).stats();
    const g = await sharp(buf).greyscale().stats();
    const mean = g.channels[0].mean;          // 0–255
    const contrast = g.channels[0].stdev;     // 0–~128
    if (mean < 28 || mean > 232 || contrast < 18) return null; // fade, blown out, or flat
    return { sharpness: s.sharpness || 0, entropy: s.entropy || 0, contrast, exposure: 1 - Math.abs(mean - 118) / 118 };
}

/** Combine scored candidates (normalised against the batch) and return the best index. */
export function bestIndex(scores) {
    const ok = scores.map((s, i) => (s ? { ...s, i } : null)).filter(Boolean);
    if (!ok.length) return -1;
    const max = (k) => Math.max(...ok.map((s) => s[k]), 1e-6);
    const [mS, mE, mC] = [max('sharpness'), max('entropy'), max('contrast')];
    let best = ok[0]; let bestScore = -Infinity;
    for (const s of ok) {
        const score = 0.45 * (s.sharpness / mS) + 0.25 * s.exposure + 0.2 * (s.entropy / mE) + 0.1 * (s.contrast / mC);
        if (score > bestScore) { bestScore = score; best = s; }
    }
    return best.i;
}

/**
 * Where the subject is, as {x, y} fractions of the image.
 * x from a 9:16 attention crop (phones), y from a 21:9 attention crop (wide screens).
 */
export async function focalPoint(buf) {
    const meta = await sharp(buf).metadata();
    const W = meta.width; const H = meta.height;
    if (!W || !H) return { x: 0.5, y: 0.5 };
    const clamp = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0.5));
    let x = 0.5; let y = 0.5;
    const tw = Math.min(W, Math.round(H * 9 / 16));
    if (tw < W) {
        const { info } = await sharp(buf).resize({ width: tw, height: H, fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
        x = (Math.abs(info.cropOffsetLeft || 0) + tw / 2) / W;
    }
    const th = Math.min(H, Math.round(W * 9 / 21));
    if (th < H) {
        const { info } = await sharp(buf).resize({ width: W, height: th, fit: 'cover', position: sharp.strategy.attention }).toBuffer({ resolveWithObject: true });
        y = (Math.abs(info.cropOffsetTop || 0) + th / 2) / H;
    }
    return { x: +clamp(x).toFixed(3), y: +clamp(y).toFixed(3) };
}

/**
 * Pick the best frame between `start` and `end` seconds.
 * `grab(time, outPath)` extracts one small frame (injected so this module has
 * no ffmpeg dependency and stays unit-testable).
 * @returns {Promise<{ time: number, score: object|null }>}
 */
export async function pickBestFrame({ start, end, count = 20, dir, grab }) {
    const span = Math.max(0.1, end - start);
    const times = Array.from({ length: count }, (_, k) => start + span * ((k + 0.5) / count));
    const scores = [];
    for (const [k, t] of times.entries()) {
        const out = path.join(dir, `cand-${k}.jpg`);
        try {
            // eslint-disable-next-line no-await-in-loop
            await grab(t, out);
            // eslint-disable-next-line no-await-in-loop
            scores.push(await scoreFrame(await fs.readFile(out)));
        } catch {
            scores.push(null);
        }
    }
    const i = bestIndex(scores);
    return i < 0 ? { time: start + span * 0.1, score: null } : { time: times[i], score: scores[i] };
}
