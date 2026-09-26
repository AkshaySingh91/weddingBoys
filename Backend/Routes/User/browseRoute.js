/**
 * GET /api/browse — faceted browsing (plan phase 6).
 *
 *   /api/browse?kind=Video&pre-wedding-themes=beach,garden&region=north-india&page=1&limit=12&sort=newestShoot
 *
 * Each query key that is a tag-group key filters by that group's tags (label,
 * slug or old name): OR within a group, AND across groups. `groups=a,b` limits
 * which groups get option counts (default: every visible category for the kind).
 * Each option's count is what the results WOULD be with it chosen, given the
 * other groups' selections — so a filter never offers a dead end.
 *
 * Public; mounted in app.js above the auth-applying clientEnquiryRoute.
 */
import express from 'express';
import PortfolioItem from '../../Models/PortfolioItem.js';
import { PUBLIC_GATE } from '../../Services/portfolioVisibility.js';
import { loadTaxonomy, slugify, normaliseLabel } from '../../Services/taxonomy.js';
import { SORTS } from '../../Services/collectionResolver.js';
import { toCard } from '../../Services/cards.js';

const Route = express.Router();
const RESERVED = new Set(['kind', 'page', 'limit', 'sort', 'groups']);

Route.get('/api/browse', async (req, res) => {
    try {
        const kind = req.query.kind === 'Photo' ? 'Photo' : 'Video';
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 12));
        const sort = SORTS[req.query.sort] || SORTS.newestShoot;
        const tax = await loadTaxonomy();
        const usable = tax.groups.filter((g) => !g.hidden && (g.appliesTo || []).includes(kind));
        const tagsOf = (g) => tax.tags.filter((t) => String(t.group) === String(g._id) && !t.hidden);

        // Selections: group key → ids of the chosen tags in that group.
        const selected = new Map();
        for (const [key, raw] of Object.entries(req.query)) {
            if (RESERVED.has(key) || typeof raw !== 'string') continue;
            const g = usable.find((x) => x.key === key);
            if (!g) continue;
            const wanted = new Set(raw.split(',').map((v) => normaliseLabel(v)).filter(Boolean).flatMap((v) => [v.toLowerCase(), slugify(v)]));
            const ids = tagsOf(g).filter((t) => wanted.has(t.slug) || wanted.has(t.label.toLowerCase()) || (t.aliases || []).some((a) => wanted.has(a))).map((t) => t._id);
            selected.set(key, ids.length ? ids : [null]); // an unknown value matches nothing
        }
        const base = { kind, ...PUBLIC_GATE };
        const clauses = (except) => [...selected.entries()].filter(([k]) => k !== except).map(([, ids]) => ({ tagIds: { $in: ids } }));
        const withClauses = (except) => { const c = clauses(except); return c.length ? { ...base, $and: c } : base; };

        const filter = withClauses(null);
        const [items, total] = await Promise.all([
            PortfolioItem.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate('client', 'clientName slug').lean(),
            PortfolioItem.countDocuments(filter),
        ]);

        const wantGroups = typeof req.query.groups === 'string' && req.query.groups
            ? req.query.groups.split(',').map((k) => usable.find((g) => g.key === k.trim())).filter(Boolean)
            : usable.filter((g) => g.legacyTagType);
        const facets = [];
        for (const g of wantGroups) {
            const options = tagsOf(g);
            const rows = await PortfolioItem.aggregate([
                { $match: withClauses(g.key) },
                { $unwind: '$tagIds' },
                { $match: { tagIds: { $in: options.map((t) => t._id) } } },
                { $group: { _id: '$tagIds', n: { $sum: 1 } } },
            ]);
            const count = new Map(rows.map((r) => [String(r._id), r.n]));
            const chosen = new Set((selected.get(g.key) || []).map(String));
            facets.push({
                key: g.key,
                label: g.label,
                options: options.map((t) => ({ slug: t.slug, label: t.label, count: count.get(String(t._id)) || 0, selected: chosen.has(String(t._id)) })),
            });
        }

        return res.status(200).json({
            items: items.map((i) => ({ ...toCard(i), wedding: [i.client?.clientName?.Bride, i.client?.clientName?.Groom].filter(Boolean).join(' & '), weddingSlug: i.client?.slug || null })),
            total, page, limit, hasMore: page * limit < total,
            facets,
        });
    } catch (error) {
        console.error('GET /api/browse error:', error);
        return res.status(500).json({ message: 'Could not browse' });
    }
});

export default Route;
