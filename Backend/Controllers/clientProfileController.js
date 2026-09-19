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
    if (coordinate && coordinate.latitude !== undefined && coordinate.longitute !== undefined) {
        await WebsiteSettingSchema.updateOne({}, {
            $push: { mapDisplayClient: { clientId, coordinate } },
        });
    }
}

// POST /api/admin/clients — create the entity only. No media.
export async function createClient(req, res) {
    try {
        const { bride, groom, isInMap, coordinate, celebrationDates, weddingDate, status } = req.body || {};
        if (!bride?.trim() || !groom?.trim()) {
            return res.status(400).json({ message: 'Both names are required' });
        }

        const client = await Client.create({
            clientName: { Bride: bride.trim(), Groom: groom.trim() },
            celebrationDates: celebrationDates || {},
            weddingDate: weddingDate || celebrationDates?.startDate || null,
            status: status || 'Draft',
            videos: [],
            photos: [],
        });

        if (isInMap === true || isInMap === 'true') {
            await setMapPin(client._id, coordinate);
        }

        return res.status(201).json({ client, clientId: String(client._id) });
    } catch (error) {
        console.error('createClient error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// PATCH /api/admin/clients/:id — rename, celebration dates, status, and move or clear the map pin.
export async function updateClientProfile(req, res) {
    try {
        const { bride, groom, isInMap, coordinate, celebrationDates, weddingDate, status, publishAllItems } = req.body || {};
        const client = await Client.findById(req.params.id);
        if (!client) return res.status(404).json({ message: 'Client not found' });

        if (bride?.trim()) client.clientName.Bride = bride.trim();
        if (groom?.trim()) client.clientName.Groom = groom.trim();
        if (celebrationDates !== undefined) client.celebrationDates = celebrationDates;
        if (weddingDate !== undefined) client.weddingDate = weddingDate;
        if (status !== undefined) client.status = status;
        await client.save();

        if (isInMap !== undefined) {
            await setMapPin(client._id, (isInMap === true || isInMap === 'true') ? coordinate : null);
        }

        // If publishAllItems is true or client status is set to Published, optionally publish all draft portfolio items
        if (publishAllItems || status === 'Published') {
            await PortfolioItem.updateMany(
                { client: client._id, status: 'Draft' },
                { $set: { status: 'Published', publishedAt: new Date() } }
            );
        }

        // clientNameText is denormalised onto every placement so search can match
        // a couple's name without a join; a rename has to reach those too.
        const clientNameText = nameOf(client);
        await PortfolioItem.updateMany({ client: client._id }, { $set: { clientNameText } });

        return res.status(200).json({ client });
    } catch (error) {
        console.error('updateClientProfile error:', error);
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

        const published = await PortfolioItem.countDocuments({ client: id, status: 'Published' });
        if (published > 0 && req.query.force !== 'true') {
            return res.status(409).json({
                message: `${nameOf(client)} still has ${published} published item${published === 1 ? '' : 's'} on the public site.`,
                publishedCount: published,
                requiresForce: true,
            });
        }

        const items = await PortfolioItem.find({ client: id }).select('media').lean();
        const mediaIds = items.map((i) => i.media).filter(Boolean);

        const purgeMedia = req.query.purge === 'true' || req.query.purgeMedia === 'true';

        await PortfolioItem.deleteMany({ client: id });

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
