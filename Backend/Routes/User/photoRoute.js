import { itemStatus } from '../../Services/portfolioStatus.js';
import { pagination } from '../../Utils/pagination.js';
import express from "express"
import ClientSchema from '../../Models/ClientSchema.js'
import PortfolioItem from '../../Models/PortfolioItem.js'
import { getObjectUrl } from '../../Controllers/awsController.js'

import { mediaUrlForKey } from '../../Utils/mediaUrl.js';
import * as portfolio from '../../Services/portfolioService.js';
import { loadTaxonomy } from '../../Services/taxonomy.js';
import { PUBLIC_GATE } from '../../Services/portfolioVisibility.js';
import websiteSettingSchema from '../../Models/WebsiteSettingSchema.js';
import { buildSelectsPdf, selectsPdfCached } from '../../Services/selectsPdf.js';
// Prefer the immutable R2 CDN URL for any asset already migrated; fall back to a
// signed S3 URL while the migration is in flight. Lookups are batched, so a page
// of assets costs one query, not one per asset.
const mediaUrl = (key) => mediaUrlForKey(key, getObjectUrl);

const Route = express.Router();
Route.get('/api/photos/:id/status', itemStatus('Photo'));

/**
 * ?q= — every word must match the couple's names, the title, the ceremony or a
 * tag ("riya haldi"). Couples are looked up first, so a name matches all of
 * their photos.
 */
const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function searchMatch(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 5);
    const clauses = await Promise.all(words.map(async (w) => {
        const re = new RegExp(escapeRe(w), 'i');
        const couples = await ClientSchema.find({ $or: [{ 'clientName.Bride': re }, { 'clientName.Groom': re }] }, { _id: 1 }).lean();
        return { $or: [{ client: { $in: couples.map((c) => c._id) } }, { title: re }, { eventGroup: re }, { tags: re }, { 'location.city': re }] };
    }));
    return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

async function getAllPhotos(req, res, next) {
    try {
        const { page, limit } = pagination(req.query, 10);
        const { tag = '', sort } = req.query;
        const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';

        // PortfolioItem path. Also adds the tag filter the gallery never had —
        // /api/photos accepted no `tag` param at all, which is why
        // WebsiteSetting.photoPagePhotoTags could never do anything.
        if (portfolio.portfolioReadsEnabled()) {
            const { items, total } = await portfolio.findFeedWithTotal({
                kind: 'Photo', tags: portfolio.parseTags(tag),
                page: parseInt(page), limit: parseInt(limit),
                sort, // optional row sort from the page composition (newestShoot…)
                match: q ? await searchMatch(q) : null,
            });
            // Public, the same for everyone: let the edge keep it briefly.
            res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
            return res.status(200).json({ photos: items.map(portfolio.toLegacyPhotoRow), total, page, limit, hasMore: page * limit < total });
        }

        const skip = (page - 1) * limit;
        const pipeline = [
            { $unwind: "$photos" },
            { $sort: { "photos.generalPriority": -1 } },
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: "$photos._id",
                    photoMetaData: "$photos.photoMetaData",
                    tags: "$photos.tags",
                    photoShootDate: "$photos.photoShootDate",
                    photoLocation: "$photos.photoLocation",
                    generalPriority: "$photos.generalPriority",
                }
            }
        ];

        let photos = await ClientSchema.aggregate(pipeline);
        // Generate signed URLs for images
        for (const photo of photos) {
            if (photo.photoMetaData && photo.photoMetaData.key) {
                photo.url = await mediaUrl(photo.photoMetaData.key);
            }
        }
        res.status(200).json({ photos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching photos" });
    }
}

Route.get("/api/photos", getAllPhotos)

/**
 * The gallery's filters: every public tag group with the tags that actually
 * have photographs, and how many — so a chip never leads to an empty page.
 * Hidden groups/tags stay out. Groups come in taxonomy order.
 */
/**
 * Your selects as a lookbook PDF (Services/selectsPdf.js).
 * ?ids=a,b,c (≤ 30 published photos, in order) &names=Riya %26 Arjun (optional, for the cover)
 */
Route.get('/api/photos/selects.pdf', async (req, res) => {
    try {
        const ids = [...new Set(String(req.query.ids || '').split(',').map((x) => x.trim()).filter((x) => /^[0-9a-f]{24}$/i.test(x)))].slice(0, 30);
        if (!ids.length) return res.status(400).json({ message: 'Choose at least one photograph' });
        const names = String(req.query.names || '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60);
        const pdf = await selectsPdfCached(`${ids.join(',')}|${names}`, async () => {
            const [items, setting] = await Promise.all([
                PortfolioItem.find({ _id: { $in: ids }, kind: 'Photo', ...PUBLIC_GATE })
                    .populate('client', 'clientName location celebrationDates weddingDate slug').lean(),
                websiteSettingSchema.findOne().lean(),
            ]);
            const byId = new Map(items.map((i) => [String(i._id), i]));
            const photos = ids.map((id) => byId.get(id)).filter(Boolean).map(portfolio.toLegacyPhotoRow);
            if (!photos.length) { const e = new Error('none'); e.status = 404; throw e; }
            const d = setting?.companyDetails || {};
            const studio = { contact: Array.isArray(d.phone) ? d.phone : d.phone ? [d.phone] : [], email: d.email || null, socials: d.companySocial || {}, address: d.address || null };
            return buildSelectsPdf({ photos, names, studio });
        });
        const file = `the-wedding-vachan-selects${names ? `-${names.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}` : ''}.pdf`;
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${file}"`,
            'Content-Length': String(pdf.length),
            'Cache-Control': 'private, max-age=600',
        });
        return res.end(pdf);
    } catch (error) {
        if (error.status === 404) return res.status(404).json({ message: 'These photographs are no longer available' });
        console.error('GET /api/photos/selects.pdf error:', error);
        return res.status(500).json({ message: 'Could not make the lookbook' });
    }
});

/** Several photos by id, in the order asked (a shared "selects" link). */
Route.get('/api/photos/batch', async (req, res) => {
    try {
        const ids = String(req.query.ids || '').split(',').map((x) => x.trim()).filter((x) => /^[0-9a-f]{24}$/i.test(x)).slice(0, 60);
        if (!ids.length) return res.json({ photos: [] });
        const items = await PortfolioItem.find({ _id: { $in: ids }, kind: 'Photo', ...PUBLIC_GATE })
            .populate('client', 'clientName location celebrationDates weddingDate slug').lean();
        const byId = new Map(items.map((i) => [String(i._id), i]));
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        return res.json({ photos: ids.map((id) => byId.get(id)).filter(Boolean).map(portfolio.toLegacyPhotoRow) });
    } catch (error) {
        console.error('GET /api/photos/batch error:', error);
        return res.status(500).json({ message: 'Could not load the photographs' });
    }
});

Route.get('/api/photos/facets', async (_req, res) => {
    try {
        const [items, tax] = await Promise.all([
            PortfolioItem.find({ kind: 'Photo', ...PUBLIC_GATE }, { tagIds: 1 }).lean(),
            loadTaxonomy(),
        ]);
        const total = items.length;
        // A filter by label matches every tag with that label (e.g. "Haldi" as a
        // ceremony and as a category), so count photos per LABEL, the same way.
        const photosByLabel = new Map();
        for (const it of items) {
            for (const id of it.tagIds || []) {
                const label = tax.tagById.get(String(id))?.label?.toLowerCase();
                if (!label) continue;
                if (!photosByLabel.has(label)) photosByLabel.set(label, new Set());
                photosByLabel.get(label).add(String(it._id));
            }
        }
        const countOf = new Map(tax.tags.map((t) => [String(t._id), photosByLabel.get(t.label.toLowerCase())?.size || 0]));
        const groups = tax.groups.filter((g) => !g.hidden).map((g) => ({
            key: g.key,
            label: g.label,
            tags: tax.tags
                .filter((t) => !t.hidden && String(t.group) === String(g._id) && countOf.get(String(t._id)))
                .map((t) => ({ label: t.label, count: countOf.get(String(t._id)), color: t.color || null })),
        })).filter((g) => g.tags.length);
        res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
        return res.json({ total, groups });
    } catch (error) {
        console.error('GET /api/photos/facets error:', error);
        return res.status(500).json({ message: 'Could not load the filters' });
    }
});
async function getSpecificPhoto(req, res, next) {
    try {
        const { id = null } = req.params
        // A malformed id is "not found" on both paths, not a CastError 500.
        if (!portfolio.isItemId(id)) return res.status(404).json({ message: 'Photo not found' });

        // Resolves by new _id or legacy subdoc id, preserving published URLs.
        if (id && portfolio.portfolioReadsEnabled()) {
            const item = await portfolio.findById(id);
            if (!item || item.kind !== 'Photo') return res.status(404).json({ message: 'Photo not found' });
            const clientId = item.client?._id || item.client;
            const siblings = await portfolio.findSiblings({
                clientId, kind: 'Photo', excludeId: item._id, limit: 120,
            });

            // BTS Credits Fallback: if photo has no credits, look up client's video credits
            let credits = Array.isArray(item.credits) ? [...item.credits] : [];
            if (!credits.length && clientId) {
                const videoWithCredits = await PortfolioItem.findOne({
                    client: clientId, kind: 'Video', 'credits.0': { $exists: true },
                }).select('credits').lean();
                if (videoWithCredits?.credits?.length) {
                    credits = videoWithCredits.credits;
                } else {
                    const clientDoc = await ClientSchema.findById(clientId).select('videos.bts').lean();
                    if (clientDoc?.videos?.[0]?.bts?.length) {
                        credits = clientDoc.videos[0].bts.map(b => ({ name: b.key, role: b.value }));
                    }
                }
            }

            // Group all client photos into ceremonies with counts and previews
            const allClientPhotos = [item, ...siblings];
            const ceremonyMap = new Map();
            for (const p of allClientPhotos) {
                const grp = p.eventGroup?.trim() || '';
                if (grp) {
                    if (!ceremonyMap.has(grp)) {
                        ceremonyMap.set(grp, {
                            name: grp,
                            count: 0,
                            coverUrl: p.render?.imageUrl || null,
                            previewPhotos: [],
                        });
                    }
                    const cEntry = ceremonyMap.get(grp);
                    cEntry.count++;
                    if (cEntry.previewPhotos.length < 5) {
                        cEntry.previewPhotos.push({
                            _id: String(p._id),
                            url: p.render?.imageUrl || null,
                            aspectRatio: p.render?.aspectRatio || 1.5,
                        });
                    }
                }
            }

            const ceremonies = Array.from(ceremonyMap.values());

            return res.status(200).json({
                clientName: item.client?.clientName,
                selectedPhoto: {
                    ...portfolio.toLegacyPhotoRow(item),
                    credits,
                    photoShootDate: portfolio.monthYear(item.shootDate),
                },
                wedding: await portfolio.storyLinkFor(clientId),
                remainingPhotos: siblings.map(portfolio.toLegacyPhotoRow),
                ceremonies,
                totalClientPhotos: allClientPhotos.length,
            });
        }

        if (id) {
            // get client name & that photo
            const clientData = await ClientSchema.findOne({ "photos._id": id }, {
                "clientName": 1,
                "photos.$": 1,
            }).lean();

            if (!clientData || !(clientData.photos[0].photoMetaData && clientData.photos[0].photoMetaData.key)) return res.status(404).json({ message: "Photo not found" });
            // change date format & id of photo
            const selectedPhoto = clientData.photos[0]
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            let date = `${months[new Date(selectedPhoto.photoShootDate).getMonth()]} ${new Date(selectedPhoto.photoShootDate).getFullYear()}`
            selectedPhoto.photoShootDate = date;
            selectedPhoto._id = selectedPhoto._id.toString();
            // get url for selected photo
            selectedPhoto.url = await mediaUrl(selectedPhoto.photoMetaData.key);

            // Fetch remaining photos of the same client
            const remainingPhotos = await ClientSchema.findOne(
                { _id: clientData._id },
                { photos: 1 }
            ).lean();
            // Filter out the selected photo
            let otherPhotos = remainingPhotos.photos.filter(photo => photo._id.toString() !== id);
            // change format of _id
            otherPhotos = otherPhotos.map(photo => ({ ...photo, _id: photo._id.toString() })); //very imp
            // get url for other photo
            for (const otherPhoto of otherPhotos) {
                const url = await mediaUrl(otherPhoto.photoMetaData.key)
                otherPhoto.url = url
            }
            res.status(200).json({
                clientName: clientData.clientName,
                wedding: await portfolio.storyLinkFor(clientData._id),
                selectedPhoto,
                remainingPhotos: otherPhotos
            });
        } else {
            res.status(400).json({ message: "Invalid photo Id" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/photos/:id", getSpecificPhoto)
Route.get("/api/photos/:id/recommended", getRecommendedPhotos);

async function getRecommendedPhotos(req, res, next) {
    try {
        const { id } = req.params;
        const { page, limit } = pagination(req.query, 10); // Infinite scrolling support
        if (!portfolio.isItemId(id)) return res.status(404).json({ message: 'Photo not found' });
        if (portfolio.portfolioReadsEnabled()) {
            const item = await portfolio.findById(id);
            if (!item || item.kind !== 'Photo') return res.status(404).json({ message: 'Photo not found' });
            const recs = await portfolio.findRecommended({ item, page: parseInt(page), limit: parseInt(limit) });
            return res.status(200).json({
                recommendedPhotos: recs.map((r) => ({ ...portfolio.toLegacyPhotoRow(r), photoShootDate: portfolio.monthYear(r.shootDate) })),
            });
        }

        // Fetch the selected photo to get its tags
        const clientData = await ClientSchema.findOne({ "photos._id": id }, { "photos.$": 1 });
        if (!clientData) return res.status(404).json({ message: "Photo not found" });

        const selectedPhoto = clientData.photos[0];
        const tags = selectedPhoto.tags;

        // Find photos from other clients with similar tags for RECOMMENDATION 
        let recommendedPhotos = await ClientSchema.aggregate([
            { $unwind: "$photos" },
            {
                $match: {
                    "photos.tags": { $in: tags },
                    "photos._id": { $ne: selectedPhoto._id }
                }
            },
            {
                $sort: { "photos.generalPriority": -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    _id: "$photos._id", //very imp
                    photoMetaData: "$photos.photoMetaData",
                    tags: "$photos.tags",
                    photoShootDate: "$photos.photoShootDate",
                    generalPriority: "$photos.generalPriority",
                    clientName: "$clientName"
                }
            }
        ]);
        recommendedPhotos = recommendedPhotos.map(photo => {
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            let date = `${months[new Date(photo.photoShootDate).getMonth()]} ${new Date(photo.photoShootDate).getFullYear()}`
            return {
                ...photo,
                _id: photo._id.toString(),  //very imp
                photoShootDate: date
            }
        }); //very imp
        // get url for other photo
        for (const photo of recommendedPhotos) {
            const url = await mediaUrl(photo.photoMetaData.key)
            photo.url = url
        }
        res.status(200).json({ recommendedPhotos });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}
export default Route;


