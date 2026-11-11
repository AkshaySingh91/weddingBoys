/**
 * Justified rows that close at every width — the last row included — with no
 * filler tiles and no holes.
 *
 * A row of n photos with aspects aᵢ (S = Σa) and k = n − 1 gutters g, in a
 * width W, has height h = (W − k·g)/S; each photo takes pᵢ = aᵢ/S of the width
 * left after gutters, so the row is exactly W. Rows are chosen by dynamic
 * programming (linear partition): minimise Σ((h − T)/T)² with every h in
 * [0.75T, 1.3T] (the last row weighted double). With more than ~1.4 rows of
 * photos a clean split always exists; a set too small to fill one row is laid
 * at a fixed height, left-aligned (the page margin, not a hole).
 *
 * It runs once per width BAND (container queries pick the band in CSS — no JS
 * on resize) and is deterministic, so server and client agree. Each tile gets
 * --p<b> (its share) and --k<b> (its row's gutters) for every band.
 *
 * Appending pages never moves what was already laid out except the last two
 * rows of the previous page (well below the screen when the next page loads).
 */

// [design width, target row height, gutter] per band — see .jgrid in globals.css
export const BANDS = [
    [367, 240, 6],   // < 420px — two portraits side by side
    [502, 260, 6],   // 420–599
    [693, 270, 8],   // 600–799
    [894, 290, 8],   // 800–999
    [1095, 310, 10], // 1000–1199
    [1342, 340, 10], // ≥ 1200
];
const MAX_ROW = 12;

function partition(a, from, to, W, T, g, lo, hi, last) {
    const f = new Array(to + 1).fill(Infinity);
    const back = new Array(to + 1).fill(-1);
    f[from] = 0;
    for (let j = from + 1; j <= to; j += 1) {
        let S = 0;
        for (let i = j; i >= Math.max(from + 1, j - MAX_ROW + 1); i -= 1) {
            S += a[i - 1];
            const h = (W - (j - i) * g) / S;
            if (h < lo * T) break;
            if (h > hi * T || f[i - 1] === Infinity) continue;
            const c = f[i - 1] + ((h - T) / T) ** 2 * (j === to && last ? 2 : 1);
            if (c < f[j]) { f[j] = c; back[j] = i - 1; }
        }
    }
    if (f[to] === Infinity) return null;
    const rows = [];
    for (let j = to; j > from; j = back[j]) rows.unshift([back[j], j]);
    return rows;
}

/** Rows [start, end) for items[from..to) in one band; SHORT sets get one fixed-height row. */
function rowsFor(a, from, to, [W, T, g], last) {
    return partition(a, from, to, W, T, g, 0.75, 1.3, last)
        || partition(a, from, to, W, T, g, 0.6, 1.75, last)
        || [[from, to, 'short']];
}

/**
 * @param {number[]} aspects   width / height per item, in order
 * @param {number[]} [chunks]  ends of appended pages (e.g. [24, 48, 61]); the last must be aspects.length
 * @returns per item: { '--a', '--p0'…'--p5', '--k0'…'--k5' } (CSS custom properties)
 */
export function justify(aspects, chunks = [aspects.length]) {
    const a = aspects.map((x) => (Number.isFinite(x) && x > 0 ? x : 1.5));
    const n = a.length;
    const out = a.map((x) => ({ '--a': x.toFixed(4) }));
    if (!n) return out;
    const ends = [...new Set([...chunks.filter((c) => c > 0 && c < n), n])].sort((x, y) => x - y);
    BANDS.forEach((band, b) => {
        const [W, T, g] = band;
        const rows = [];
        let start = 0;
        ends.forEach((end, ci) => {
            const final = ci === ends.length - 1;
            const r = rowsFor(a, start, end, band, final);
            // keep all but the last two rows of a page that is not the last; they re-flow with the next page
            const keep = final ? r : r.slice(0, Math.max(0, r.length - 2));
            rows.push(...keep);
            start = keep.length ? keep[keep.length - 1][1] : start;
        });
        for (const [s, e, short] of rows) {
            const k = e - s - 1;
            const S = a.slice(s, e).reduce((x, y) => x + y, 0);
            const free = W - k * g;
            let used = 0;
            for (let i = s; i < e; i += 1) {
                // a SHORT set keeps its own height (1.6T), so it is narrower than the row
                const p = short ? Math.min(1, (a[i] * Math.min(1.6 * T, free / S)) / free) : i === e - 1 ? 1 - used : a[i] / S;
                used += p;
                out[i][`--p${b}`] = p.toFixed(6);
                out[i][`--k${b}`] = String(k);
            }
        }
    });
    return out;
}

/** The image `sizes` for a tile from its band shares (phone first). */
export const tileSizes = (v) => `(max-width: 419px) ${Math.ceil(Number(v['--p0']) * 100)}vw, (max-width: 799px) ${Math.ceil(Number(v['--p2']) * 100)}vw, ${Math.ceil(Number(v['--p5']) * 1342)}px`;
