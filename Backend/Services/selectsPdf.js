/**
 * "Your selects" as a lookbook PDF — the shortlist a couple circled on /photos,
 * printed the way a studio would hand it over, with the studio on every page.
 *
 *   Cover      a gold double frame (an invitation card), the TWV monogram, a
 *              collage of the first selects laid out with the same hole-free
 *              guillotine maths as the site, the lead frame circled in red
 *              grease pencil, and the couple's names when they gave them
 *   Frames     one photograph a page (two landscapes share one), each circled
 *              and numbered like a contact-sheet select, with what it is and a
 *              link back to its page
 *   Close      the studio's ground (wine), "Let's make yours", the studio's
 *              real contacts, a QR code to check a date
 *
 * Images: the 1024/1600 webp rung of each photo (never the original), turned
 * into ~1200px JPEGs with sharp. Fonts: Bodoni Moda + Inter (OFL, bundled in
 * assets/fonts). Finished PDFs are kept briefly in memory, keyed by request.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import QRCode from 'qrcode';

const here = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.join(here, '..', 'assets', 'fonts');
const SITE = (process.env.PUBLIC_SITE_URL || 'https://theweddingvachan.com').replace(/\/$/, '');

// The brand's own email and Instagram accounts (never the old "Wedding Boys" ones).
const STUDIO_EMAIL = 'theweddingvachanofficial@gmail.com';
const PHONES = ['+918080825560', '+919156466515']; // the studio's two official numbers
const INSTAGRAM = [['Mumbai', 'https://www.instagram.com/theweddingvachanofficial/'], ['Varanasi', 'https://www.instagram.com/theweddingvachan_varanasi/']];

const C = { ground: '#FBF6EE', raised: '#FFFFFF', ink: '#33161A', muted: '#7A6A66', accent: '#D9342A', gold: '#C9A227', deep: '#33161A', onDeep: '#FBF6EE' };
const W = 595.28; const H = 841.89; // A4, points

const coupleOf = (c) => [c?.Bride, c?.Groom].filter(Boolean).join(' & ');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
/** "Haldi at Riya & Arjun's wedding"; for the wedding itself, "Riya & Arjun's wedding". */
const whatOf = (p) => {
    const c = coupleOf(p.clientName); const r = rite(p.eventGroup);
    if (c) return !r || r === 'Wedding' ? `${c}'s wedding` : `${r} at ${c}'s wedding`;
    return r || p.title || 'A wedding photograph';
};
const aspectOf = (p) => Number(p.aspectRatio) || (p.width && p.height ? p.width / p.height : 1.5);

/* ── images ────────────────────────────────────────────────────────────── */

/** The largest ladder rung (≤1600, ≤ the photo's own width) for an R2 still. */
function rungUrl(url, width) {
    const m = /\/(?:(\d{3,4})\.webp|orig\.[a-z0-9]+)(?=[?#]|$)/i.exec(url || '');
    if (!m) return url;
    const top = Math.min(m[1] ? Number(m[1]) : Infinity, 1600, Number(width) > 0 ? Math.max(640, Number(width)) : Infinity);
    const w = [640, 1024, 1600].filter((x) => x <= top).pop() || 640;
    return `${url.slice(0, m.index)}/${w}.webp${url.slice(m.index + m[0].length)}`;
}

async function jpegOf(p) {
    for (const u of [rungUrl(p.url, p.width), p.url]) {
        try {
            const res = await fetch(u, { signal: AbortSignal.timeout(15000) });
            if (!res.ok) continue;
            const buf = Buffer.from(await res.arrayBuffer());
            return await sharp(buf).rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 78, mozjpeg: true }).toBuffer();
        } catch { /* try the next source */ }
    }
    return null;
}

async function mapLimit(list, n, fn) {
    const out = new Array(list.length);
    let i = 0;
    await Promise.all(Array.from({ length: Math.min(n, list.length) }, async () => {
        while (i < list.length) { const k = i++; out[k] = await fn(list[k], k); }
    }));
    return out;
}

/* ── the guillotine collage (same maths as Next-Frontend/lib/mosaic.js) ──── */

function trees(a, i, j, memo) {
    const key = `${i}:${j}`;
    if (memo.has(key)) return memo.get(key);
    const out = [];
    if (j - i === 1) out.push({ a: a[i], share: 1, leaf: i });
    else {
        for (let k = i + 1; k < j; k += 1) {
            for (const L of trees(a, i, k, memo)) {
                for (const R of trees(a, k, j, memo)) {
                    const s = L.a + R.a;
                    out.push({ cut: 'row', a: s, share: Math.min(L.share * (L.a / s), R.share * (R.a / s)), kids: [L, R] });
                    out.push({ cut: 'col', a: 1 / (1 / L.a + 1 / R.a), share: Math.min(L.share, R.share), kids: [L, R] });
                }
            }
        }
    }
    memo.set(key, out);
    return out;
}
function bestTree(aspects, target) {
    let best = null; let bestScore = Infinity;
    for (const t of trees(aspects, 0, aspects.length, new Map())) {
        const s = Math.abs(Math.log(t.a / target)) + 3 * Math.max(0, 0.22 - t.share);
        if (s < bestScore) { best = t; bestScore = s; }
    }
    return best;
}
/** Rectangles for each leaf of `t` laid into box (x, y, w, h) with gutters. */
function layout(t, x, y, w, h, gap, out = []) {
    if (t.leaf != null) { out.push({ leaf: t.leaf, x, y, w, h }); return out; }
    const [L, R] = t.kids;
    if (t.cut === 'row') {
        const lw = (w - gap) * (L.a / (L.a + R.a));
        layout(L, x, y, lw, h, gap, out); layout(R, x + lw + gap, y, w - lw - gap, h, gap, out);
    } else {
        const lh = (h - gap) * ((1 / L.a) / (1 / L.a + 1 / R.a));
        layout(L, x, y, w, lh, gap, out); layout(R, x, y + lh + gap, w, h - lh - gap, gap, out);
    }
    return out;
}

/* ── drawing ───────────────────────────────────────────────────────────── */

// The site's hand-drawn select loops (Component/photos/PhotoTile.jsx), scaled to a box.
const LOOPS = {
    portrait: ['M40 4 C58 4 63 18 63 50 C63 82 55 97 33 96 C11 95 3 82 3 50 C3 19 12 4 35 4 C41 4 46 6 50 9', 66],
    landscape: ['M86 4 C128 4 147 14 147 50 C147 84 126 96 76 96 C27 96 3 86 3 50 C3 16 26 4 80 4 C92 4 101 6 108 9', 150],
};
function loop(doc, x, y, w, h, { width = 2.2, out = 7 } = {}) {
    const [d, vw] = w / h < 1 ? LOOPS.portrait : LOOPS.landscape;
    const bx = x - out; const by = y - out; const bw = w + out * 2; const bh = h + out * 2;
    let n = 0;
    const scaled = d.replace(/-?\d+(\.\d+)?/g, (v) => {
        const num = Number(v); const isX = n++ % 2 === 0;
        return (isX ? bx + (num / vw) * bw : by + (num / 100) * bh).toFixed(2);
    });
    doc.save().path(scaled).lineWidth(width).lineCap('round').lineJoin('round').strokeColor(C.accent).stroke().restore();
}
function photo(doc, img, x, y, w, h) {
    if (!img) { doc.save().rect(x, y, w, h).fill('#E9DFD3').restore(); return; }
    doc.save().rect(x, y, w, h).clip();
    doc.image(img, x, y, { cover: [w, h], align: 'center', valign: 'center' });
    doc.restore();
}
const fit = (a, bw, bh) => (a > bw / bh ? { w: bw, h: bw / a } : { w: bh * a, h: bh });
function doubleFrame(doc, color) {
    doc.save().lineWidth(0.8).strokeColor(color).rect(22, 22, W - 44, H - 44).stroke();
    doc.lineWidth(0.4).rect(28, 28, W - 56, H - 56).stroke().restore();
}
function monogram(doc, cx, cy, color) {
    doc.save().lineWidth(0.9).strokeColor(color).circle(cx, cy, 24).stroke();
    doc.lineWidth(0.4).circle(cx, cy, 27).stroke();
    doc.font('Bodoni').fontSize(17).fillColor(color).text('TWV', cx - 40, cy - 10, { width: 80, align: 'center' });
    doc.restore();
}
const spaced = (doc, str, x, y, opts = {}) => doc.font('Inter').fontSize(opts.size || 8).fillColor(opts.color || C.ink)
    .text(str.toUpperCase(), x, y, { width: opts.width || W - x * 2, align: opts.align || 'center', characterSpacing: opts.spacing ?? 2.4 });

/* ── the document ──────────────────────────────────────────────────────── */

function cover(doc, { photos, imgs, names }) {
    doc.addPage();
    doc.rect(0, 0, W, H).fill(C.ground);
    doubleFrame(doc, C.gold);
    monogram(doc, W / 2, 76, C.gold);
    spaced(doc, 'The Wedding Vachan', 60, 112, { size: 8, color: C.ink, spacing: 3.2 });

    // the collage: the first (up to) five selects, hole-free
    const lead = photos.slice(0, 5);
    const bx = 64; const by = 146; const bw = W - 128; const bh = 410;
    const t = bestTree(lead.map(aspectOf), bw / bh);
    const box = fit(t.a, bw, bh);
    const ox = bx + (bw - box.w) / 2; const oy = by + (bh - box.h) / 2;
    const rects = layout(t, ox, oy, box.w, box.h, 6);
    rects.forEach((r) => photo(doc, imgs[r.leaf], r.x, r.y, r.w, r.h));
    const big = rects.reduce((m, r) => (r.w * r.h > m.w * m.h ? r : m), rects[0]);
    loop(doc, big.x, big.y, big.w, big.h, { width: 2.6, out: 8 });

    const ty = oy + box.h + 40;
    spaced(doc, 'A lookbook of selects', 60, ty, { size: 8.5, color: C.accent, spacing: 3 });
    doc.font('Bodoni').fontSize(names ? 38 : 40).fillColor(C.ink)
        .text(names ? `${names}` : 'Our wedding selects', 60, ty + 18, { width: W - 120, align: 'center', lineGap: 2 });
    const n = photos.length;
    doc.font('Inter').fontSize(10.5).fillColor(C.muted)
        .text(`${n} photograph${n === 1 ? '' : 's'} circled from real weddings photographed by The Wedding Vachan.`, 80, doc.y + 8, { width: W - 160, align: 'center' });
    const made = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(`Made on ${made}`, 80, doc.y + 2, { width: W - 160, align: 'center' });

    doc.save().lineWidth(0.5).strokeColor(C.gold).moveTo(W / 2 - 40, H - 70).lineTo(W / 2 + 40, H - 70).stroke().restore();
    spaced(doc, SITE.replace(/^https?:\/\//, ''), 60, H - 60, { size: 7.5, color: C.muted, spacing: 2 });
    doc.link(60, H - 64, W - 120, 14, SITE);
}

function header(doc, { names, page, pages }) {
    doc.rect(0, 0, W, H).fill(C.ground);
    spaced(doc, 'The Wedding Vachan', 48, 40, { size: 7, color: C.muted, align: 'left', width: 220, spacing: 2.2 });
    doc.font('Inter').fontSize(7.5).fillColor(C.muted)
        .text(`${names ? `${names}, ` : ''}selects ${String(page).padStart(2, '0')} of ${String(pages).padStart(2, '0')}`, W - 268, 40, { width: 220, align: 'right' });
    doc.save().lineWidth(0.4).strokeColor(C.gold).moveTo(48, H - 44).lineTo(W - 48, H - 44).stroke().restore();
    doc.font('Inter').fontSize(7).fillColor(C.muted).text(SITE.replace(/^https?:\/\//, ''), 48, H - 36, { width: W - 96, align: 'center' });
}

/** One frame in a box: the photo, its loop, its number, what it is, a link. */
function frame(doc, p, img, n, x, y, w, h) {
    const capH = 40;
    const box = fit(aspectOf(p), w, h - capH);
    const px = x + (w - box.w) / 2; const py = y;
    photo(doc, img, px, py, box.w, box.h);
    loop(doc, px, py, box.w, box.h);
    // the select's number, pencilled at the corner
    doc.save().rotate(-6, { origin: [px + box.w - 4, py - 2] });
    doc.font('Bodoni').fontSize(22).fillColor(C.accent).text(String(n).padStart(2, '0'), px + box.w - 34, py - 26, { width: 40, align: 'right', lineBreak: false });
    doc.restore();
    const url = `${SITE}/photos/${p._id}`;
    doc.font('Inter').fontSize(10).fillColor(C.ink).text(whatOf(p), px, py + box.h + 14, { width: box.w, align: 'left', lineBreak: false, ellipsis: true });
    doc.font('Inter').fontSize(8.5).fillColor(C.accent).text('See it on our site', px, py + box.h + 28, { width: box.w, align: 'left', link: url, underline: false, lineBreak: false });
}

async function closing(doc, studio) {
    doc.addPage();
    doc.rect(0, 0, W, H).fill(C.deep);
    doubleFrame(doc, C.gold);
    monogram(doc, W / 2, 120, C.gold);
    doc.font('Bodoni').fontSize(46).fillColor(C.onDeep).text("Let's make yours.", 60, 200, { width: W - 120, align: 'center' });
    doc.font('Inter').fontSize(12).fillColor(C.onDeep).opacity(0.85)
        .text('Tell us your date, and bring these selects along.', 90, doc.y + 14, { width: W - 180, align: 'center' });
    doc.opacity(1);

    const qr = await QRCode.toBuffer(`${SITE}/contact`, { margin: 1, width: 360, color: { dark: '#33161AFF', light: '#FBF6EEFF' } });
    const qs = 132;
    doc.image(qr, W / 2 - qs / 2, 340, { width: qs, height: qs });
    doc.link(W / 2 - qs / 2, 340, qs, qs, `${SITE}/contact`);
    spaced(doc, 'Scan to check your date', 60, 340 + qs + 14, { size: 8, color: C.gold, spacing: 2.6 });

    const lines = [];
    PHONES.forEach((c) => lines.push({ label: 'Call or WhatsApp', value: c.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2'), link: `https://wa.me/${c.replace(/\D/g, '')}` }));
    const email = studio?.email && !/weddingboys/i.test(studio.email) ? studio.email : STUDIO_EMAIL;
    lines.push({ label: 'Email', value: email, link: `mailto:${email}` });
    for (const [place, ig] of INSTAGRAM) lines.push({ label: `Instagram, ${place}`, value: `@${ig.replace(/\/+$/, '').split('/').pop()}`, link: ig });
    lines.push({ label: 'Website', value: SITE.replace(/^https?:\/\//, ''), link: SITE });
    let y = 560;
    for (const l of lines) {
        doc.font('Inter').fontSize(7.5).fillColor(C.gold).text(l.label.toUpperCase(), 120, y, { width: 150, characterSpacing: 1.8 });
        doc.font('Inter').fontSize(11).fillColor(C.onDeep).text(l.value, 270, y - 2, { width: 220, link: l.link, lineBreak: false });
        y += 26;
    }
    if (studio?.address) {
        doc.font('Inter').fontSize(8.5).fillColor(C.onDeep).opacity(0.7).text(studio.address, 100, H - 110, { width: W - 200, align: 'center' });
        doc.opacity(1);
    }
}

/** photos: rows in the gallery shape (toLegacyPhotoRow). Resolves to a Buffer. */
export async function buildSelectsPdf({ photos, names = '', studio = null }) {
    const imgs = await mapLimit(photos, 4, jpegOf);
    const doc = new PDFDocument({ size: 'A4', margin: 0, autoFirstPage: false,
        info: { Title: names ? `${names}: selects` : 'Wedding selects', Author: 'The Wedding Vachan', Creator: 'The Wedding Vachan' } });
    doc.registerFont('Bodoni', path.join(FONTS, 'BodoniModa.ttf'));
    doc.registerFont('Inter', path.join(FONTS, 'Inter.ttf'));
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    const done = new Promise((resolve, reject) => { doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject); });

    cover(doc, { photos, imgs, names });

    // pages: a portrait alone; two landscapes in a row share a page
    const pages = [];
    for (let i = 0; i < photos.length; i += 1) {
        if (aspectOf(photos[i]) > 1.05 && photos[i + 1] && aspectOf(photos[i + 1]) > 1.05) { pages.push([i, i + 1]); i += 1; }
        else pages.push([i]);
    }
    pages.forEach((idxs, pi) => {
        doc.addPage();
        header(doc, { names, page: pi + 1, pages: pages.length });
        const top = 92; const bottom = H - 70; const x = 56; const w = W - 112;
        if (idxs.length === 1) frame(doc, photos[idxs[0]], imgs[idxs[0]], idxs[0] + 1, x, top, w, bottom - top);
        else {
            const each = (bottom - top - 24) / 2;
            idxs.forEach((k, j) => frame(doc, photos[k], imgs[k], k + 1, x, top + j * (each + 24), w, each));
        }
    });

    await closing(doc, studio);
    doc.end();
    return done;
}

/* ── a small cache (same request within half an hour → same file) ──────── */
const cache = new Map();
const TTL = 30 * 60 * 1000;
export async function selectsPdfCached(key, make) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL) return hit.value;
    const value = make();
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 12) cache.delete(cache.keys().next().value);
    try { return await value; } catch (e) { cache.delete(key); throw e; }
}
