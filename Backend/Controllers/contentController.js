// controllers/contentController.js
import { z } from 'zod';
import PageContent, { BLOCK_TYPES } from '../Models/PageContent.js';
import { getObjectUrl } from './awsController.js';
import { resolveMedia, mediaUrlForKey } from '../Utils/mediaUrl.js';
import { ensureDefaultBlocks } from '../Utils/pageLayouts.js';
import { queueRevalidate } from '../Services/revalidate.js';

// ---- media serialization ---------------------------------------------------

/**
 * Serialise a Media reference for the public CMS payload.
 *
 * This used to start from `cdnUrl || publicUrl` and then UNCONDITIONALLY
 * overwrite it with `getObjectUrl(storageKey)` — which always signs against the
 * S3 bucket. For an R2-backed asset that replaced a perfectly good CDN URL with
 * a signed URL for an object that does not exist in that bucket: a well-formed
 * link that 404s at fetch time, so any R2 media in a CMS block rendered broken.
 *
 * Now: R2 assets use their immutable CDN URL directly, and only genuinely
 * legacy S3-backed assets fall back to signing.
 */
async function signer() {
    const cache = new Map();
    return async (media) => {
        if (!media) return null;
        const id = String(media._id);
        if (cache.has(id)) return cache.get(id);

        let url = resolveMedia(media) || '';
        if (media.provider === 'S3' && media.storageKey) {
            try {
                url = await mediaUrlForKey(media.storageKey, getObjectUrl);
            } catch {
                // Keep whatever stored URL we already have.
            }
        }
        const out = {
            _id: media._id,
            mediaId: media.mediaId,
            mediaType: media.mediaType,
            title: media.title,
            altText: media.altText,
            caption: media.caption,
            width: media.width,
            height: media.height,
            duration: media.duration,
            // Delivery hints the frontend needs for CLS-free, blur-up rendering.
            aspectRatio: media.aspectRatio,
            blurDataURL: media.blurDataURL,
            dominantColor: media.dominantColor,
            imageVariants: media.imageVariants,
            video: media.video,
            url,
        };
        cache.set(id, out);
        return out;
    };
}

// Replace populated Media documents (in block.media and item.media) with a
// lean, URL-signed shape the frontend can render directly.
async function serializePage(pageDoc) {
    const page = pageDoc.toObject ? pageDoc.toObject() : pageDoc;
    const sign = await signer();

    const resolveList = async (arr) => {
        if (!Array.isArray(arr)) return [];
        const out = [];
        for (const m of arr) {
            // Unpopulated (still an ObjectId) → skip; populated → serialize.
            if (m && m._id) out.push(await sign(m));
        }
        return out;
    };

    for (const block of page.blocks || []) {
        block.media = await resolveList(block.media);
        for (const item of block.items || []) {
            item.media = await resolveList(item.media);
        }
    }
    return page;
}

const populateMedia = (q) => q.populate('blocks.media').populate('blocks.items.media');

// ---- validation ------------------------------------------------------------

const itemSchema = z.object({
    _id: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    body: z.string().optional(),
    link: z.string().optional(),
    media: z.array(z.string()).optional(),      // Media ObjectIds
    meta: z.record(z.string(), z.any()).optional(),
}).passthrough();

const blockSchema = z.object({
    _id: z.string().optional(),
    key: z.string().optional(),
    type: z.enum(BLOCK_TYPES),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    body: z.string().optional(),
    link: z.string().optional(),
    media: z.array(z.string()).optional(),
    items: z.array(itemSchema).optional(),
    settings: z.record(z.string(), z.any()).optional(),
    order: z.number().optional(),
    visible: z.boolean().optional(),
}).passthrough();

const upsertSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['Draft', 'Published']).optional(),
    blocks: z.array(blockSchema),
});

const zodFail = (res, error) => res.status(400).json({
    message: error.issues[0]?.message || 'Invalid content',
    errors: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
});

// ---- public ----------------------------------------------------------------

// GET /api/content/:pageKey  — Published content with signed media URLs.
export async function getPageContent(req, res) {
    try {
        const page = await populateMedia(
            PageContent.findOne({ pageKey: req.params.pageKey.toLowerCase(), status: 'Published' }),
        );
        if (!page) return res.status(404).json({ message: 'Page not found' });

        const serialized = await serializePage(page);
        // Hide hidden blocks and keep them ordered for the public site.
        serialized.blocks = (serialized.blocks || [])
            .filter((b) => b.visible !== false)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        return res.status(200).json({ page: serialized });
    } catch (error) {
        console.error('getPageContent error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// GET /api/content  — published page keys only, for sitemap generation.
// Deliberately returns no block content and no Draft pages: this is a public,
// unauthenticated endpoint, so it exposes nothing beyond the fact that a page
// exists at that URL. The full editable listing stays on the admin route.
export async function listPublishedPageKeys(_req, res) {
    try {
        const pages = await PageContent.find({ status: 'Published' })
            .select('pageKey title updatedAt')
            .lean();
        return res.status(200).json({
            pages: pages.map((p) => ({
                pageKey: p.pageKey,
                title: p.title,
                status: 'Published',
                updatedAt: p.updatedAt,
            })),
        });
    } catch (error) {
        console.error('listPublishedPageKeys error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---- admin -----------------------------------------------------------------

// GET /api/admin/content  — list all managed pages.
export async function listPages(_req, res) {
    try {
        const pages = await PageContent.find()
            .select('pageKey title status updatedAt blocks')
            .lean();
        return res.status(200).json({
            pages: pages.map((p) => ({
                pageKey: p.pageKey,
                title: p.title,
                status: p.status,
                updatedAt: p.updatedAt,
                blockCount: (p.blocks || []).length,
            })),
        });
    } catch (error) {
        console.error('listPages error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// GET /api/admin/content/:pageKey  — full editable content (auto-creates empty).
export async function getAdminPageContent(req, res) {
    try {
        const pageKey = req.params.pageKey.toLowerCase();
        let raw = await PageContent.findOne({ pageKey });
        if (!raw) {
            raw = await PageContent.create({ pageKey, title: req.params.pageKey, blocks: [] });
        }
        // Ensure the page reflects the real site sections (appends missing
        // defaults by key; never removes/overwrites admin edits).
        if (ensureDefaultBlocks(raw, pageKey)) {
            await raw.save();
        }

        const page = await populateMedia(PageContent.findById(raw._id));
        const serialized = await serializePage(page);
        serialized.blocks = (serialized.blocks || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        return res.status(200).json({ page: serialized });
    } catch (error) {
        console.error('getAdminPageContent error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// PUT /api/admin/content/:pageKey  — replace the page's blocks wholesale.
export async function upsertPageContent(req, res) {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const pageKey = req.params.pageKey.toLowerCase();
        // Normalize ordering to the incoming array order.
        const blocks = parsed.data.blocks.map((b, i) => ({ ...b, order: i }));

        const update = {
            ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
            ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
            ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
            blocks,
            updatedBy: req.user?.email || req.admin?.email,
        };

        const page = await PageContent.findOneAndUpdate(
            { pageKey },
            { $set: update, $setOnInsert: { pageKey } },
            { new: true, upsert: true, runValidators: true },
        );

        const populated = await populateMedia(PageContent.findById(page._id));
        const serialized = await serializePage(populated);
        // The page is cached for up to an hour (home: a minute); drop it now.
        queueRevalidate({ tags: [`page:${pageKey}`] });
        return res.status(200).json({ message: 'Content saved', page: serialized });
    } catch (error) {
        console.error('upsertPageContent error:', error);
        return res.status(400).json({ message: error.message });
    }
}

// DELETE /api/admin/content/:pageKey
export async function deletePage(req, res) {
    try {
        await PageContent.deleteOne({ pageKey: req.params.pageKey.toLowerCase() });
        queueRevalidate({ tags: [`page:${req.params.pageKey.toLowerCase()}`] });
        return res.status(200).json({ message: 'Page deleted' });
    } catch (error) {
        console.error('deletePage error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}
