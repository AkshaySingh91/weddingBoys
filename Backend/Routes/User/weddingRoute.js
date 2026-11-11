/**
 * Public wedding story pages (plan phase 4):
 *
 *   GET /api/weddings[?city=udaipur&page=1&limit=24]   published stories, newest first
 *   GET /api/weddings/:slug                             one story; an old slug answers
 *                                                       { redirectTo } for a 301
 *
 * A story is public when the wedding is Published, its story is on, it has a
 * slug, and at least one of its items passes the public gate. Only public
 * items are ever returned (Services/portfolioVisibility.js).
 *
 * Mounted in app.js ABOVE clientEnquiryRoute: that router applies admin auth to
 * everything after it, and a public route mounted later would require a login.
 */
import express from 'express';
import mongoose from 'mongoose';
import Client from '../../Models/ClientSchema.js';
import PortfolioItem from '../../Models/PortfolioItem.js';
import { PUBLIC_GATE } from '../../Services/portfolioVisibility.js';
import { loadTaxonomy, SYSTEM_GROUPS } from '../../Services/taxonomy.js';
import { toCard, toWeddingCard, crewOf } from '../../Services/cards.js';
import ClientReview from '../../Models/ReviewSchema.js';
import { resolveNode } from '../../Utils/mediaUrl.js';
import { getObjectUrl } from '../../Controllers/awsController.js';

const Route = express.Router();

const STORY_FILTER = { status: 'Published', slug: { $type: 'string' }, 'story.enabled': { $ne: false } };
const ITEM_ORDER = { order: 1, shootDate: 1, _id: 1 };
const SLUG_RX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const listOf = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const riteLabel = (l) => (l === 'Wedding / Pheras' ? 'the wedding' : l.toLowerCase());

/**
 * The couple's story fields, with factual defaults when the admin left them
 * empty — built only from the wedding's own data, never invented sentiment.
 * `generated` says which parts are defaults, so the page can style them.
 */
export function storyFor(client, card, ceremonies, crew) {
    const s = client.story || {};
    const city = client.location?.city || '';
    const venue = client.location?.venue || '';
    const rites = ceremonies.map((c) => c.label).filter((l) => l && l !== 'More moments');
    const counts = { ceremonies: rites.length, films: card.films || 0, photos: card.photos || 0 };

    const aboutWritten = [s.about, s.intro].filter((t) => typeof t === 'string' && t.trim());
    const facts = [];
    if (rites.length) facts.push(`${card.title}'s celebration: ${listOf(rites.map(riteLabel))}${city ? `, in ${venue ? `${venue}, ` : ''}${city}` : ''}${card.dates ? `, ${card.dates}` : ''}.`);
    else if (city || card.dates) facts.push(`${card.title}'s wedding${city ? ` in ${city}` : ''}${card.dates ? `, ${card.dates}` : ''}.`);
    const parts = [counts.films && `${counts.films} film${counts.films === 1 ? '' : 's'}`, counts.photos && `${counts.photos} photograph${counts.photos === 1 ? '' : 's'}`].filter(Boolean);
    if (parts.length) facts.push(`Told here in ${listOf(parts)}${crew.length ? `, by a crew of ${crew.length}` : ''}.`);

    const highlights = (s.highlights || []).filter((h) => h?.label && h?.value);
    const defaultHighlights = [
        counts.ceremonies && { label: counts.ceremonies === 1 ? 'Ceremony' : 'Ceremonies', value: String(counts.ceremonies) },
        counts.films && { label: counts.films === 1 ? 'Film' : 'Films', value: String(counts.films) },
        counts.photos && { label: 'Photographs', value: String(counts.photos) },
        city && { label: 'City', value: city },
    ].filter(Boolean);

    return {
        headline: s.headline || (city ? `Their wedding, in ${city}` : 'Their wedding story'),
        about: aboutWritten.length ? aboutWritten.join('\n\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : facts,
        quote: s.quote?.text ? { text: s.quote.text, by: s.quote.by || card.title } : null,
        highlights: highlights.length ? highlights : defaultHighlights,
        generated: { headline: !s.headline, about: !aboutWritten.length, highlights: !highlights.length },
    };
}

/** Public counts and a cover for each wedding, in one aggregation plus one find. */
async function cardsFor(clients) {
    if (!clients.length) return [];
    const ids = clients.map((c) => c._id);
    const [counts, covers, firsts] = await Promise.all([
        PortfolioItem.aggregate([
            { $match: { client: { $in: ids }, ...PUBLIC_GATE } },
            { $group: { _id: { client: '$client', kind: '$kind' }, n: { $sum: 1 }, firstShoot: { $min: '$shootDate' } } },
        ]),
        PortfolioItem.find({ _id: { $in: clients.map((c) => c.cover).filter(Boolean) }, ...PUBLIC_GATE }).lean(),
        // No chosen cover (or it is not public): the first film, else the first photo.
        PortfolioItem.aggregate([
            { $match: { client: { $in: ids }, ...PUBLIC_GATE } },
            { $sort: { kind: -1, ...ITEM_ORDER } }, // descending kind: 'Video' before 'Photo'
            { $group: { _id: '$client', item: { $first: '$$ROOT' } } },
        ]),
    ]);
    const countBy = new Map();
    for (const r of counts) {
        const key = String(r._id.client);
        const entry = countBy.get(key) || { films: 0, photos: 0, firstShoot: null };
        if (r._id.kind === 'Video') entry.films = r.n; else entry.photos = r.n;
        if (r.firstShoot && (!entry.firstShoot || r.firstShoot < entry.firstShoot)) entry.firstShoot = r.firstShoot;
        countBy.set(key, entry);
    }
    const coverById = new Map(covers.map((i) => [String(i._id), i]));
    const firstBy = new Map(firsts.map((r) => [String(r._id), r.item]));
    return clients
        .filter((c) => countBy.has(String(c._id)))
        .map((c) => toWeddingCard(c, coverById.get(String(c.cover)) || firstBy.get(String(c._id)), countBy.get(String(c._id))));
}

Route.get('/api/weddings', async (req, res) => {
    try {
        const limit = Math.min(60, parseInt(req.query.limit, 10) || 24);
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : '';
        const clients = await Client.find({ ...STORY_FILTER, ...(city ? { 'location.citySlug': city } : {}) })
            .select('clientName slug location celebrationDates weddingDate cover featured publishedAt')
            .sort({ featured: -1, weddingDate: -1, publishedAt: -1, _id: -1 })
            .lean();
        // Weddings with nothing public drop out, so paginate after the filter.
        const cards = await cardsFor(clients);
        const start = (page - 1) * limit;
        return res.status(200).json({ weddings: cards.slice(start, start + limit), total: cards.length, page, hasMore: start + limit < cards.length });
    } catch (error) {
        console.error('GET /api/weddings error:', error);
        return res.status(500).json({ message: 'Could not load weddings' });
    }
});

/**
 * GET /api/weddings/:slug/status — cheap, for the Next proxy: whether a story
 * page exists before any HTML streams, so a missing story is a real 404 and an
 * old slug a real 308 (once a page streams, its status is fixed at 200).
 *   200 { status: 'ok' } | 200 { status: 'moved', slug } | 404 { status: 'missing' }
 */
Route.get('/api/weddings/:slug/status', async (req, res) => {
    try {
        const slug = String(req.params.slug || '').toLowerCase();
        if (!SLUG_RX.test(slug)) return res.status(404).json({ status: 'missing' });
        const client = await Client.findOne({ ...STORY_FILTER, slug }).select('_id').lean();
        if (client) {
            const any = await PortfolioItem.exists({ client: client._id, ...PUBLIC_GATE });
            return any ? res.status(200).json({ status: 'ok' }) : res.status(404).json({ status: 'missing' });
        }
        const moved = await Client.findOne({ ...STORY_FILTER, slugHistory: slug }).select('slug').lean();
        return moved ? res.status(200).json({ status: 'moved', slug: moved.slug }) : res.status(404).json({ status: 'missing' });
    } catch (error) {
        console.error('GET /api/weddings/:slug/status error:', error);
        return res.status(500).json({ status: 'error' });
    }
});

Route.get('/api/weddings/:slug', async (req, res) => {
    try {
        const slug = String(req.params.slug || '').toLowerCase();
        if (!SLUG_RX.test(slug)) return res.status(404).json({ message: 'Wedding not found' });

        // STORY_FILTER first: it has its own `slug` condition, which would
        // otherwise overwrite this one and match any published story.
        let client = await Client.findOne({ ...STORY_FILTER, slug }).lean();
        if (!client) {
            // An old slug: send the visitor to the current page.
            const moved = await Client.findOne({ ...STORY_FILTER, slugHistory: slug }).select('slug').lean();
            if (moved) return res.status(200).json({ redirectTo: moved.slug });
            return res.status(404).json({ message: 'Wedding not found' });
        }

        const items = await PortfolioItem.find({ client: client._id, ...PUBLIC_GATE }).sort(ITEM_ORDER).lean();
        if (!items.length) return res.status(404).json({ message: 'Wedding not found' });

        // Group by ceremony, in the order the admin set in the tag manager;
        // items with no ceremony close the page as "More moments".
        const tax = await loadTaxonomy();
        const ceremonyGroup = tax.groupByKey.get(SYSTEM_GROUPS.ceremony);
        const ceremonyTags = ceremonyGroup ? tax.tags.filter((t) => String(t.group) === String(ceremonyGroup._id)) : [];
        const ceremonyOf = (i) => ceremonyTags.find((t) => (i.tagIds || []).some((id) => String(id) === String(t._id)));
        const groups = new Map();
        for (const i of items) {
            const t = ceremonyOf(i);
            const key = t ? String(t._id) : 'more';
            if (!groups.has(key)) groups.set(key, { key: t?.slug || 'more-moments', label: t?.label || 'More moments', color: t?.color || null, order: t ? t.order : Number.MAX_SAFE_INTEGER, films: [], photos: [] });
            const g = groups.get(key);
            (i.kind === 'Video' ? g.films : g.photos).push(toCard(i));
        }
        const ceremonies = [...groups.values()].sort((a, b) => a.order - b.order).map(({ order, ...g }) => g);

        const cover = items.find((i) => String(i._id) === String(client.cover)) || items.find((i) => i.kind === 'Video') || items[0];
        const card = toWeddingCard(client, cover, {
            films: items.filter((i) => i.kind === 'Video').length,
            photos: items.filter((i) => i.kind === 'Photo').length,
            firstShoot: items.map((i) => i.shootDate).filter(Boolean).sort((a, b) => a - b)[0],
        });

        // Related: same city first, then the most recent others.
        const others = await Client.find({ ...STORY_FILTER, _id: { $ne: client._id } })
            .select('clientName slug location celebrationDates weddingDate cover featured publishedAt')
            .sort({ weddingDate: -1, publishedAt: -1, _id: -1 }).limit(24).lean();
        const sameCity = client.location?.citySlug ? others.filter((o) => o.location?.citySlug === client.location.citySlug) : [];
        const related = (await cardsFor([...sameCity, ...others.filter((o) => !sameCity.includes(o))])).slice(0, 3);

        // The couple's own words, when a review is linked to this wedding (Admin › Home › Couple reviews).
        const reviews = await Promise.all((await ClientReview.find({ client: client._id }).sort({ createdAt: 1 }).lean()).map(async (r) => ({
            name: r.person?.name || '',
            role: r.person?.gender || '',
            text: String(r.reviewText || '').trim().replace(/^["“]+|["”]+$/g, ''),
            photoUrl: (r.photo?.mediaId || r.photo?.key) ? await resolveNode(r.photo, getObjectUrl).catch(() => null) : null,
        })));

        const crew = crewOf(items);
        return res.status(200).json({
            wedding: {
                ...card,
                intro: client.story?.intro || null,
                story: storyFor(client, card, ceremonies, crew),
                celebrationDates: {
                    startDate: client.celebrationDates?.startDate || client.weddingDate || null,
                    endDate: client.celebrationDates?.endDate || null,
                },
                publishedAt: client.publishedAt || null,
                updatedAt: client.updatedAt || null,
            },
            films: items.filter((i) => i.kind === 'Video').map(toCard),
            ceremonies,
            crew,
            reviews,
            related,
        });
    } catch (error) {
        if (error instanceof mongoose.Error.CastError) return res.status(404).json({ message: 'Wedding not found' });
        console.error('GET /api/weddings/:slug error:', error);
        return res.status(500).json({ message: 'Could not load the wedding' });
    }
});

export default Route;
