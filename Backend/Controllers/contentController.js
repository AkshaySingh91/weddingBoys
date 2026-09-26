// controllers/contentController.js
import { z } from 'zod';
import PageContent, { BLOCK_TYPES } from '../Models/PageContent.js';
import { getObjectUrl } from './awsController.js';
import { resolveMedia, mediaUrlForKey } from '../Utils/mediaUrl.js';
import { ensureDefaultBlocks } from '../Utils/pageLayouts.js';
import { queueRevalidate } from '../Services/revalidate.js';
import { parseSectionSettings, collectionRefs } from '../Utils/sectionSettings.js';
import { resolveBlocks } from '../Services/pageComposer.js';
import Collection from '../Models/Collection.js';

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

    for (const block of [...(page.blocks || []), ...(page.draft?.blocks || [])]) {
        block.media = await resolveList(block.media);
        for (const item of block.items || []) {
            item.media = await resolveList(item.media);
        }
    }
    return page;
}

const populateMedia = (q) => q.populate('blocks.media').populate('blocks.items.media')
    .populate('draft.blocks.media').populate('draft.blocks.items.media');

/**
 * Section settings validated per component, and every row they name must exist
 * and show the right kind (films rows for film sections, photo rows for the
 * photo grid). Returns { blocks } or { error }.
 */
async function validateBlocks(blocks) {
    const out = [];
    for (const b of blocks) {
        if (b.type !== 'section') { out.push(b); continue; }
        const r = parseSectionSettings(b.settings?.component, b.settings);
        if (r.error) return { error: r.error };
        out.push({ ...b, settings: r.settings });
    }
    const refs = collectionRefs(out);
    if (refs.length) {
        const found = await Collection.find({ key: { $in: refs.map((x) => x.key) } }).select('key kind').lean();
        const kindOf = new Map(found.map((c) => [c.key, c.kind]));
        const missing = refs.filter((x) => !kindOf.has(x.key));
        if (missing.length) return { error: `No row called ${[...new Set(missing.map((x) => `"${x.key}"`))].join(', ')}` };
        const wrong = refs.filter((x) => kindOf.get(x.key) !== x.kind);
        if (wrong.length) return { error: `${wrong.map((x) => `"${x.key}"`).join(', ')} shows ${wrong[0].kind === 'Video' ? 'photos, not films' : 'films, not photos'}` };
    }
    return { blocks: out };
}

/** The editable copy: the draft when there is one, else what is live. */
function workingCopy(serialized) {
    const d = serialized.draft;
    const hasDraft = Array.isArray(d?.blocks);
    const blocks = (hasDraft ? d.blocks : serialized.blocks || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    return {
        ...serialized,
        title: hasDraft && d.title !== undefined ? d.title : serialized.title,
        description: hasDraft && d.description !== undefined ? d.description : serialized.description,
        blocks,
        hasDraft,
        draftSavedAt: hasDraft ? d.savedAt : null,
        draftSavedBy: hasDraft ? d.savedBy : null,
        liveBlockCount: (serialized.blocks || []).length,
        draft: undefined,
    };
}

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

// GET /api/content/:pageKey[?resolve=1]  — Published content with signed media
// URLs; `resolve=1` also resolves each composable section's rows (the data it
// shows), so a server-rendered page needs one request.
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
        delete serialized.draft; // the admin's working copy is not public
        if (req.query.resolve === '1') serialized.blocks = await resolveBlocks(serialized.blocks);

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
            // Default sections are added once, when the page is created. They
            // used to be re-appended every time the editor opened, so a default
            // block an admin deleted came back. "Restore defaults" does it on request.
            raw = new PageContent({ pageKey, title: req.params.pageKey, blocks: [] });
            ensureDefaultBlocks(raw, pageKey);
            await raw.save();
        }

        const page = await populateMedia(PageContent.findById(raw._id));
        return res.status(200).json({ page: workingCopy(await serializePage(page)) });
    } catch (error) {
        console.error('getAdminPageContent error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

/**
 * PUT /api/admin/content/:pageKey { blocks, title?, description?, status }
 *
 *   status 'Published'  publish: the blocks go live, the draft is cleared
 *   anything else       save a draft: the live page is NOT touched
 *
 * "Save Draft" used to write `status: 'Draft'` onto the live page — which
 * unpublished the whole home page until someone pressed Publish again.
 */
export async function upsertPageContent(req, res) {
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const pageKey = req.params.pageKey.toLowerCase();
        const who = req.user?.email || req.admin?.email;
        // Normalize ordering to the incoming array order.
        const checked = await validateBlocks(parsed.data.blocks.map((b, i) => ({ ...b, order: i })));
        if (checked.error) return res.status(400).json({ message: checked.error });
        const { blocks } = checked;
        const publish = parsed.data.status === 'Published';

        const update = publish
            ? {
                $set: {
                    ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
                    ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
                    status: 'Published',
                    blocks,
                    publishedAt: new Date(),
                    publishedBy: who,
                    updatedBy: who,
                },
                $unset: { draft: '' },
                $setOnInsert: { pageKey },
            }
            : {
                $set: {
                    draft: {
                        blocks,
                        title: parsed.data.title,
                        description: parsed.data.description,
                        savedAt: new Date(),
                        savedBy: who,
                    },
                    updatedBy: who,
                },
                $setOnInsert: { pageKey },
            };

        const page = await PageContent.findOneAndUpdate({ pageKey }, update, { new: true, upsert: true, runValidators: true });

        const populated = await populateMedia(PageContent.findById(page._id));
        const serialized = workingCopy(await serializePage(populated));
        // Only a publish changes what visitors see. The page is cached (home:
        // a minute, others an hour); drop it now.
        if (publish) queueRevalidate({ tags: [`page:${pageKey}`] });
        return res.status(200).json({ message: publish ? 'Published' : 'Draft saved', page: serialized });
    } catch (error) {
        console.error('upsertPageContent error:', error);
        return res.status(400).json({ message: error.message });
    }
}

// POST /api/admin/content/:pageKey/discard — throw the draft away.
export async function discardDraft(req, res) {
    try {
        const pageKey = req.params.pageKey.toLowerCase();
        const page = await PageContent.findOneAndUpdate({ pageKey }, { $unset: { draft: '' } }, { new: true });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        const populated = await populateMedia(PageContent.findById(page._id));
        return res.status(200).json({ message: 'Draft discarded', page: workingCopy(await serializePage(populated)) });
    } catch (error) {
        console.error('discardDraft error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// POST /api/admin/content/:pageKey/restore-defaults — add the page's default
// sections that are missing, to the draft (never to the live page).
export async function restoreDefaults(req, res) {
    try {
        const pageKey = req.params.pageKey.toLowerCase();
        const page = await PageContent.findOne({ pageKey });
        if (!page) return res.status(404).json({ message: 'Page not found' });
        const working = { blocks: (page.draft?.blocks || page.blocks).map((b) => (b.toObject ? b.toObject() : b)) };
        if (!ensureDefaultBlocks(working, pageKey)) return res.status(200).json({ message: 'Every default section is already there', added: 0 });
        page.draft = { ...(page.draft?.toObject?.() || {}), blocks: working.blocks, savedAt: new Date(), savedBy: req.user?.email || req.admin?.email };
        await page.save();
        const populated = await populateMedia(PageContent.findById(page._id));
        return res.status(200).json({ message: 'Default sections added to the draft', page: workingCopy(await serializePage(populated)) });
    } catch (error) {
        console.error('restoreDefaults error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// POST /api/admin/content/:pageKey/preview { blocks } — what the (unsaved or
// draft) sections would show, resolved like the public page.
export async function previewPage(req, res) {
    try {
        const blocks = Array.isArray(req.body?.blocks) ? req.body.blocks : [];
        const checked = await validateBlocks(blocks.filter((b) => b && b.type === 'section'));
        if (checked.error) return res.status(400).json({ message: checked.error });
        const resolved = await resolveBlocks(checked.blocks, { includeDrafts: true });
        return res.status(200).json({ sections: resolved.map((b) => ({ key: b.key, component: b.settings?.component, data: b.data })) });
    } catch (error) {
        console.error('previewPage error:', error);
        return res.status(500).json({ message: 'Server error' });
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
