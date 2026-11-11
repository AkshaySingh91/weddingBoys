/**
 * Mosaic maths for photo sets with mixed shapes — no holes, ever.
 *
 * A guillotine layout is a tree of cuts. Side by side (a row) the pieces share a
 * height, so their aspects add: a = a1 + a2. Stacked (a column) they share a
 * width, so the inverses add: 1/a = 1/a1 + 1/a2. Any such tree fills its
 * rectangle exactly. We try every tree over the photos IN THEIR ORDER (≤ 6
 * photos: at most 42 shapes × 32 cut choices) and keep the one closest to the
 * target shape with no tile too narrow.
 *
 * When no arrangement of the photos alone reaches the target (one portrait, two
 * portraits…), a "jelly" tile joins: a designed tile whose aspect is whatever
 * is left, so the rectangle still closes.
 *
 * Rendering is pure CSS (see <Mosaic>): a row child gets flex-grow = its
 * aspect, a column child flex-grow = 1/aspect, and only the root has
 * aspect-ratio — so the layout is known before any image loads (CLS 0).
 */

const MAX = 6;

/** Every guillotine tree over items[i..j). */
function trees(items, i, j, memo) {
    const key = `${i}:${j}`;
    if (memo.has(key)) return memo.get(key);
    const out = [];
    if (j - i === 1) {
        out.push({ a: items[i], share: 1, leaf: i });
    } else {
        for (let k = i + 1; k < j; k += 1) {
            for (const L of trees(items, i, k, memo)) {
                for (const R of trees(items, k, j, memo)) {
                    const a = L.a + R.a; // side by side
                    out.push({ cut: 'row', a, share: Math.min(L.share * (L.a / a), R.share * (R.a / a)), kids: [L, R] });
                    out.push({ cut: 'col', a: 1 / (1 / L.a + 1 / R.a), share: Math.min(L.share, R.share), kids: [L, R] });
                }
            }
        }
    }
    memo.set(key, out);
    return out;
}

/** Merge nested cuts of the same direction: row(row(a,b),c) → row(a,b,c). */
function flatten(n) {
    if (n.leaf != null || n.jelly) return n;
    const kids = n.kids.map(flatten).flatMap((k) => (k.cut === n.cut ? k.kids : [k]));
    return { ...n, kids };
}

/**
 * The best layout for one group of photos.
 * @param {number[]} aspects   width / height of each photo, in order
 * @param {{lo?: number, hi?: number, minShare?: number}} opts
 *   lo..hi    block shapes that read well at full width (no cost inside); a
 *             block taller than lo costs three times more than one wider than
 *             hi, because at full width "tall" means a screen and a half
 *   minShare  no photo narrower than this fraction of the block
 * @returns tree: { a, cut?: 'row'|'col', kids?, leaf?: index, jelly?: true }
 */
export function guillotine(aspects, { lo = 1.0, hi = 2.4, minShare = 0.17 } = {}) {
    const items = aspects.slice(0, MAX).map((a) => (Number.isFinite(a) && a > 0 ? a : 1.5));
    if (!items.length) return null;
    const shape = (a) => (a < lo ? 3 * Math.log(lo / a) : a > hi ? Math.log(a / hi) : 0) + 0.15 * Math.abs(Math.log(a / 1.5));
    const score = (t) => shape(t.a) + 3 * Math.max(0, minShare - t.share);
    // A jelly tile costs a little, plus how much of the block it takes.
    const jellyCost = (area) => 0.05 + 1.2 * area;
    const goal = 1.35;
    let best = null;
    let bestScore = Infinity;
    for (const t of trees(items, 0, items.length, new Map())) {
        const s = score(t);
        if (s < bestScore) { best = t; bestScore = s; }
        // Too tall: a jelly tile beside it closes the rectangle at the goal shape.
        if (t.a < lo) {
            const ja = goal - t.a;
            const withJelly = { cut: 'row', a: goal, share: Math.min(t.share * (t.a / goal), ja / goal), kids: [t, { jelly: true, a: ja, share: 1 }] };
            const sj = score(withJelly) + jellyCost(ja / goal);
            if (sj < bestScore) { best = withJelly; bestScore = sj; }
        }
        // Too wide: a jelly band beneath it.
        if (t.a > hi) {
            const ja = 1 / (1 / hi - 1 / t.a);
            const withJelly = { cut: 'col', a: hi, share: t.share, kids: [t, { jelly: true, a: ja, share: 1 }] };
            const sj = score(withJelly) + jellyCost(hi / ja);
            if (sj < bestScore) { best = withJelly; bestScore = sj; }
        }
    }
    return flatten(best);
}

/** Split n photos into groups of at most 6, as even as possible (7 → 4 + 3). */
export function chunks(list, size = MAX) {
    const n = Math.ceil(list.length / size) || 0;
    const out = [];
    let start = 0;
    for (let g = 0; g < n; g += 1) {
        const take = Math.ceil((list.length - start) / (n - g));
        out.push(list.slice(start, start + take));
        start += take;
    }
    return out;
}
