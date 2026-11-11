/**
 * Client identity — the entity, separate from its media.
 *
 * The old intake flow could only create a client *together with* its uploads,
 * in one all-or-nothing request. That forced the browser to hold every file
 * until the whole form was valid, and it is why an upload could not report
 * progress against a real client folder: there was no client id until the very
 * end. Creating the entity first makes the wizard resumable and lets uploads
 * carry `ownerType: 'Client'` from the first byte.
 */
import mongoose from 'mongoose';
import Client from '../Models/ClientSchema.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import Media from '../Models/Media.js';
import { rollupByClient, storageByClient, EMPTY_STATS } from '../Services/clientStats.js';
import WebsiteSettingSchema from '../Models/WebsiteSettingSchema.js';
import { deleteSingleMediaDoc } from './mediaController.js';
import { PUBLIC_GATE, setClientStatus, markMediaGone } from '../Services/portfolioVisibility.js';
import { revalidatePortfolio } from '../Services/revalidate.js';
import { slugForNames, uniqueSlug, checkSlug, slugTaken, locationFrom } from '../Services/weddingProfile.js';
import { explainVisibility } from '../Services/portfolioVisibility.js';
import Collection from '../Models/Collection.js';

const STATUSES = ['Draft', 'Published', 'Archived'];

const nameOf = (c) => [c?.clientName?.Bride, c?.clientName?.Groom].filter(Boolean).join(' & ');

/**
 * Set, move or clear a client's pin on the destination map.
 *
 * Scoped `$pull` then `$push`, never a read-modify-write of the whole array.
 * The previous helper appended unconditionally, so re-saving a client added a
 * SECOND pin for the same couple, and there was no code path anywhere in the
 * client screens that could move or remove one. `upsert` is deliberately absent:
 * every reader uses `findOne()`, so creating a second settings document here
 * would silently fork all site configuration.
 */
async function setMapPin(clientId, coordinate) {
    await WebsiteSettingSchema.updateOne({}, { $pull: { mapDisplayClient: { clientId } } });
    if (coordinate) {
        await WebsiteSettingSchema.updateOne({}, {
            $push: { mapDisplayClient: { clientId, coordinate } },
        });
    }
}

/**
 * Read `isInMap` + `coordinate` from a request body.
 *
 * Both coordinates must be real numbers in range. `Number('')` and
 * `Number(null)` are 0, so the old `!== undefined` check pinned a couple with
 * blank fields at (0, 0); and on edit, an invalid pin silently removed the
 * existing one. Now a bad pin is a 400 and nothing changes.
 *
 * @returns {{ error: string } | { coordinate: {latitude:number, longitute:number} | null }}
 */
function readMapPin(isInMap, coordinate) {
    if (!(isInMap === true || isInMap === 'true')) return { coordinate: null };
    const num = (v) => (typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN));
    const latitude = num(coordinate?.latitude);
    const longitute = num(coordinate?.longitute);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitute)
        || Math.abs(latitude) > 90 || Math.abs(longitute) > 180) {
        return { error: 'A map pin needs both latitude (-90 to 90) and longitude (-180 to 180) as numbers.' };
    }
    return { coordinate: { latitude, longitute } };
}

/** The couple's current pin, in the shape the profile form edits. */
async function mapPinOf(clientId) {
    const settings = await WebsiteSettingSchema.findOne(
        { 'mapDisplayClient.clientId': clientId },
        { 'mapDisplayClient.$': 1 },
    ).lean();
    const coordinate = settings?.mapDisplayClient?.[0]?.coordinate || null;
    return { isInMap: Boolean(coordinate), coordinate };
}

/**
 * GET /api/admin/clients/:id — the profile the workspace edits, map pin included.
 *
 * The workspace used to open its profile form with the pin blank (nothing
 * returned it), so saving a rename sent `isInMap: false` and deleted the pin.
 */
export async function getClientProfile(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client id' });
        }
        const client = await Client.findById(id)
            .select('clientName celebrationDates weddingDate status publishedAt slug slugHistory location cover featured story createdAt updatedAt')
            .lean();
        if (!client) return res.status(404).json({ message: 'Client not found' });
        return res.status(200).json({ client: { ...client, mapPin: await mapPinOf(client._id) } });
    } catch (error) {
        console.error('getClientProfile error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * The story fields an admin may set, cleaned: trimmed, capped, blanks dropped.
 * Returns only the keys present in `story` so a partial update stays partial.
 */
export function storyFieldsFrom(story = {}) {
    const out = {};
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
    if (story.intro !== undefined) out.intro = str(story.intro, 2000) ?? '';
    if (story.headline !== undefined) out.headline = str(story.headline, 140) ?? '';
    if (story.about !== undefined) out.about = str(story.about, 4000) ?? '';
    if (story.quote !== undefined) out.quote = { text: str(story.quote?.text, 400) ?? '', by: str(story.quote?.by, 120) ?? '' };
    if (story.highlights !== undefined) {
        out.highlights = (Array.isArray(story.highlights) ? story.highlights : [])
            .map((h) => ({ label: str(h?.label, 40) || '', value: str(h?.value, 60) || '' }))
            .filter((h) => h.label && h.value)
            .slice(0, 6);
    }
    if (story.enabled !== undefined) out.enabled = Boolean(story.enabled);
    return out;
}

// POST /api/admin/clients — create the entity only. No media.
export async function createClient(req, res) {
    try {
        const {
            bride, groom, isInMap, coordinate, celebrationDates, weddingDate, status,
            location, city, venue, state, story, createRequestId,
        } = req.body || {};
        if (!bride?.trim() || !groom?.trim()) {
            return res.status(400).json({ message: 'Both names are required' });
        }
        const pin = readMapPin(isInMap, coordinate);
        if (pin.error) return res.status(400).json({ message: pin.error });
        if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ message: `status must be one of ${STATUSES.join(', ')}` });

        // A retried create (double click, flaky network) returns the wedding the
        // first request made instead of a second one.
        const requestId = typeof createRequestId === 'string' && createRequestId.trim() ? createRequestId.trim().slice(0, 100) : undefined;
        if (requestId) {
            const existing = await Client.findOne({ createRequestId: requestId });
            if (existing) return res.status(200).json({ client: existing, clientId: String(existing._id), repeated: true });
        }

        const date = new Date(weddingDate || celebrationDates?.startDate || NaN);
        const slug = await uniqueSlug(slugForNames(bride.trim(), groom.trim()), { year: Number.isNaN(date.getTime()) ? undefined : date.getFullYear() });
        let client;
        try {
            client = await Client.create({
                clientName: { Bride: bride.trim(), Groom: groom.trim() },
                celebrationDates: celebrationDates || {},
                weddingDate: weddingDate || celebrationDates?.startDate || null,
                status: status || 'Draft',
                ...(status === 'Published' ? { publishedAt: new Date() } : {}),
                slug,
                location: locationFrom(location || { city, venue, state }),
                story: { enabled: true, ...storyFieldsFrom(story || {}) },
                createRequestId: requestId,
                videos: [],
                photos: [],
            });
        } catch (error) {
            // Two identical requests racing: the loser returns the winner's wedding.
            if (error?.code === 11000 && requestId) {
                const existing = await Client.findOne({ createRequestId: requestId });
                if (existing) return res.status(200).json({ client: existing, clientId: String(existing._id), repeated: true });
            }
            throw error;
        }

        if (pin.coordinate) await setMapPin(client._id, pin.coordinate);

        return res.status(201).json({ client, clientId: String(client._id) });
    } catch (error) {
        console.error('createClient error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// PATCH /api/admin/clients/:id — rename, celebration dates, status, and move or clear the map pin.
export async function updateClientProfile(req, res) {
    try {
        const {
            bride, groom, isInMap, coordinate, celebrationDates, weddingDate, status,
            slug, location, city, venue, state, story, cover, featured,
        } = req.body || {};
        const pin = isInMap !== undefined ? readMapPin(isInMap, coordinate) : null;
        if (pin?.error) return res.status(400).json({ message: pin.error });
        if (status !== undefined && !STATUSES.includes(status)) return res.status(400).json({ message: `status must be one of ${STATUSES.join(', ')}` });
        let client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (bride?.trim()) client.clientName.Bride = bride.trim();
        if (groom?.trim()) client.clientName.Groom = groom.trim();
        if (celebrationDates !== undefined) client.celebrationDates = celebrationDates;
        if (weddingDate !== undefined) client.weddingDate = weddingDate;

        // ---- the story page -------------------------------------------------
        let storyChanged = false;
        if (slug !== undefined && slug !== client.slug) {
            let next;
            try { next = checkSlug(slug); } catch (e) { return res.status(e.status || 400).json({ message: e.message }); }
            if (await slugTaken(next, client._id)) return res.status(409).json({ message: `"${next}" is used by another wedding` });
            // The old slug keeps working as a redirect to the new one.
            const history = new Set([...(client.slugHistory || []), ...(client.slug ? [client.slug] : [])]);
            history.delete(next);
            client.slugHistory = [...history];
            client.slug = next;
            storyChanged = true;
        }
        if (location !== undefined || city !== undefined || venue !== undefined || state !== undefined) {
            const current = client.location?.toObject?.() || client.location || {};
            client.location = locationFrom({ ...current, ...(location || {}), ...(city !== undefined ? { city } : {}), ...(venue !== undefined ? { venue } : {}), ...(state !== undefined ? { state } : {}) });
            storyChanged = true;
        }
        if (story !== undefined) {
            const fields = storyFieldsFrom(story || {});
            for (const [k, v] of Object.entries(fields)) client.story[k] = v;
            client.markModified('story');
            storyChanged = true;
        }
        if (featured !== undefined) { client.featured = Boolean(featured); storyChanged = true; }
        if (cover !== undefined) {
            if (cover === null || cover === '') client.cover = undefined;
            else {
                if (!mongoose.isValidObjectId(cover) || !(await PortfolioItem.exists({ _id: cover, client: client._id }))) {
                    return res.status(400).json({ message: 'The cover must be one of this wedding\'s films or photos' });
                }
                client.cover = cover;
            }
            storyChanged = true;
        }
        await client.save();
        if (storyChanged) revalidatePortfolio();

        if (pin) await setMapPin(client._id, pin.coordinate);

        // The wedding's status is a gate, not a cascade: items keep their own
        // status, so unpublish → republish brings back exactly what was live and
        // an item hidden on purpose stays hidden. (This used to set every Draft
        // item to Published on publish — re-exposing hidden work. The old
        // `publishAllItems` flag is ignored; publishing hidden items is an
        // explicit bulk action in the workspace.)
        let publicItems;
        if (status !== undefined && status !== client.status) {
            ({ client, publicItems } = await setClientStatus(client._id, status));
        }

        // clientNameText is denormalised onto every placement so search can match
        // a couple's name without a join; a rename has to reach those too.
        const clientNameText = nameOf(client);
        const renamed = await PortfolioItem.updateMany({ client: client._id, clientNameText: { $ne: clientNameText } }, { $set: { clientNameText } });
        if (renamed.modifiedCount) revalidatePortfolio();

        if (publicItems === undefined) publicItems = await PortfolioItem.countDocuments({ client: client._id, ...PUBLIC_GATE });
        return res.status(200).json({ client: { ...client.toObject(), mapPin: await mapPinOf(client._id) }, publicItems });
    } catch (error) {
        console.error('updateClientProfile error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * GET /api/admin/clients/:id/readiness — the "Review & publish" checklist.
 *
 * What goes live the moment the wedding is published, what follows later on its
 * own (still processing), and what will not appear, with the reason. Blockers
 * stop a publish; warnings are shown and may be ignored (plan: a missing
 * ceremony warns, never blocks).
 */
export async function getClientReadiness(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid client id' });
        const client = await Client.findById(id).select('clientName status slug location cover story').lean();
        if (!client) return res.status(404).json({ message: 'Client not found' });
        const items = await PortfolioItem.find({ client: id })
            .select('kind status clientStatus mediaReady tagIds eventGroup render media external')
            .populate('media', 'status processing.lastError')
            .lean();

        // As if the wedding were published: the item's own status and its file decide.
        const asPublished = items.map((i) => ({ item: i, v: explainVisibility({ ...i, clientStatus: 'Published' }, i.media) }));
        const count = (reason) => asPublished.filter(({ v }) => v.reasons.includes(reason)).length;
        const goesLive = asPublished.filter(({ v }) => v.public);
        const counts = {
            items: items.length,
            films: items.filter((i) => i.kind === 'Video').length,
            photos: items.filter((i) => i.kind === 'Photo').length,
            goesLive: goesLive.length,
            goesLiveFilms: goesLive.filter(({ item }) => item.kind === 'Video').length,
            goesLivePhotos: goesLive.filter(({ item }) => item.kind === 'Photo').length,
            processing: count('processing'),
            failed: count('failed'),
            missing: count('asset-missing'),
            hidden: count('hidden-by-admin'),
            untagged: items.filter((i) => !(i.tagIds || []).length).length,
            noCeremony: items.filter((i) => !i.eventGroup).length,
        };

        const blockers = [];
        const warnings = [];
        if (!client.clientName?.Bride || !client.clientName?.Groom) blockers.push({ code: 'names', message: 'Both names are needed' });
        if (!items.length) blockers.push({ code: 'empty', message: 'Add at least one film or photo' });
        else if (!goesLive.length && !counts.processing) blockers.push({ code: 'nothing-live', message: 'Nothing would be visible: every item is hidden or its file is missing' });
        if (counts.processing) warnings.push({ code: 'processing', message: `${counts.processing} still processing — they go live by themselves when ready` });
        if (counts.failed) warnings.push({ code: 'failed', message: `${counts.failed} failed to process — re-upload or remove them` });
        if (counts.missing) warnings.push({ code: 'missing', message: `${counts.missing} have a missing file and will not show` });
        if (counts.hidden) warnings.push({ code: 'hidden', message: `${counts.hidden} are hidden and stay hidden` });
        if (counts.untagged) warnings.push({ code: 'untagged', message: `${counts.untagged} have no tags, so they appear in no row (only on the story page)` });
        if (counts.noCeremony) warnings.push({ code: 'no-ceremony', message: `${counts.noCeremony} have no ceremony — they appear under "More moments" on the story page` });
        if (!client.location?.city) warnings.push({ code: 'no-city', message: 'No city — the story page and city pages cannot place it' });
        if (!client.cover) warnings.push({ code: 'no-cover', message: 'No cover chosen — the first film or photo is used' });
        if (client.story?.enabled === false) warnings.push({ code: 'story-off', message: 'The story page is turned off' });

        return res.status(200).json({
            status: client.status,
            slug: client.slug,
            storyUrl: client.slug && client.story?.enabled !== false ? `/weddings/story/${client.slug}` : null,
            counts, blockers, warnings,
            ready: blockers.length === 0,
        });
    } catch (error) {
        console.error('getClientReadiness error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * POST /api/admin/clients/:id/order { ids } — the admin's drag order.
 * Items keep their relative order; any not listed follow, as they were.
 */
export async function reorderClientItems(req, res) {
    try {
        const { id } = req.params;
        const { ids } = req.body || {};
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid client id' });
        if (!Array.isArray(ids) || !ids.length || !ids.every((x) => mongoose.isValidObjectId(x))) {
            return res.status(400).json({ message: 'ids must be a list of item ids' });
        }
        const owned = await PortfolioItem.find({ client: id, _id: { $in: ids } }).select('_id').lean();
        if (owned.length !== new Set(ids.map(String)).size) return res.status(400).json({ message: 'Every id must be an item of this wedding' });
        await PortfolioItem.bulkWrite(ids.map((itemId, order) => ({
            updateOne: { filter: { _id: itemId, client: id }, update: { $set: { order } }, timestamps: false },
        })));
        revalidatePortfolio();
        return res.status(200).json({ ok: true, ordered: ids.length });
    } catch (error) {
        console.error('reorderClientItems error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * GET /api/admin/clients/:id/stats — one client's rollup.
 *
 * Counts come from PortfolioItem in a single $group. Storage has to come from
 * Media instead, because PortfolioItem carries no size at all — and it is read
 * off the existing {ownerType, ownerId} index rather than joined. Note ownerId
 * is stored as a STRING, so it is matched as one.
 */
export async function getClientStats(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client id' });
        }

        // Same functions the list uses, so a card and its detail view can never
        // report different numbers for the same client.
        const [rollup, storage] = await Promise.all([rollupByClient(id), storageByClient(id)]);
        const s = storage.get(String(id));

        return res.status(200).json({
            stats: {
                ...EMPTY_STATS,
                ...(rollup.get(String(id)) || {}),
                storageBytes: s?.bytes || 0,
                assetCount: s?.assets || 0,
            },
        });
    } catch (error) {
        console.error('getClientStats error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * DELETE /api/admin/clients/:id
 *
 * Deletes the wedding and its placements. It does NOT delete bytes: the assets
 * return to the media library as Unassigned, so a mistaken delete costs
 * metadata, never footage. Removing the files is a separate, deliberate act in
 * the library.
 *
 * Refuses while published work exists unless `?force=true`, because deleting a
 * client silently pulls their films off the public site.
 */
export async function deleteClient(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid client id' });
        }
        const client = await Client.findById(id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        // Only work visitors can actually see counts: a draft wedding's items are
        // not on the site whatever their own status says.
        const published = await PortfolioItem.countDocuments({ client: id, ...PUBLIC_GATE });
        if (published > 0 && req.query.force !== 'true') {
            return res.status(409).json({
                message: `${nameOf(client)} still has ${published} item${published === 1 ? '' : 's'} live on the public site.`,
                publishedCount: published,
                requiresForce: true,
            });
        }

        const items = await PortfolioItem.find({ client: id }).select('media').lean();
        const mediaIds = items.map((i) => i.media).filter(Boolean);

        const purgeMedia = req.query.purge === 'true' || req.query.purgeMedia === 'true';

        await PortfolioItem.deleteMany({ client: id });
        // Rows must not keep pins to items that no longer exist.
        const itemIds = items.map((i) => i._id);
        await Collection.updateMany({}, { $pull: { pinned: { $in: itemIds }, hidden: { $in: itemIds } } });

        let purgedCount = 0;
        let releasedCount = 0;

        if (purgeMedia) {
            // Find all media owned by client or attached via portfolio items
            const allClientMedia = await Media.find({
                $or: [
                    { ownerType: 'Client', ownerId: String(id) },
                    { _id: { $in: mediaIds } },
                ],
            });

            await Promise.allSettled(allClientMedia.map((m) => deleteSingleMediaDoc(m)));
            const purgedIds = allClientMedia.map((m) => m._id);
            // A purged file may be another wedding's custom poster.
            await Promise.all(purgedIds.map((m) => markMediaGone(m)));
            if (purgedIds.length) {
                await Media.deleteMany({ _id: { $in: purgedIds } });
            }
            purgedCount = purgedIds.length;
        } else if (mediaIds.length) {
            await Media.updateMany({ _id: { $in: mediaIds } }, {
                $set: { ownerType: 'System', ownerId: null },
            });
            releasedCount = mediaIds.length;
        }

        await setMapPin(client._id, null);
        await Client.deleteOne({ _id: client._id });
        revalidatePortfolio();

        return res.status(200).json({
            message: `${nameOf(client)} removed`,
            removedItems: items.length,
            releasedAssets: releasedCount,
            purgedAssets: purgedCount,
        });
    } catch (error) {
        console.error('deleteClient error:', error);
        return res.status(500).json({ message: error.message });
    }
}

export { setMapPin };
