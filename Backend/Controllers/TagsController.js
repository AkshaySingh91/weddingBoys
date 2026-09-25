import Tags from '../Models/TagsSchema.js'
import websiteSettingsSchema from "../Models/WebsiteSettingSchema.js"
import clientSchema from "../Models/ClientSchema.js"
import { taxonomyExists, legacyTagCategories, resolveTagParam } from '../Services/taxonomy.js'
// this will get all tag with their category
// Once the tag system exists (scripts/migrateTagsToTaxonomy.js) this answers
// from it, in the same shape; until then from the old `Tags` collection.
async function getAllTags(req, res, next) {
    try {
        const allTags = (await taxonomyExists()) ? await legacyTagCategories() : await Tags.find();
        res.status(200).json({ allTags })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
// this will add new tag type with theirs tags
async function addNewTagCategory(req, res) {
    try {
        let { tagType, tags } = req.body;
        tagType = tagType.charAt(0).toUpperCase() + tagType.slice(1);
        tags = tags.map((t) => t.charAt(0).toUpperCase() + t.slice(1));

        const allTags = await Tags.create({
            tagType, tags
        });
        res.status(200).json({ allTags })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
/**
 * Add ONE term to an existing category. Additive and nothing else.
 *
 * Replaces the category editor's bulk save (`PUT /api/admin/tags`), which was
 * retired: it deleted every tag and recreated the list, orphaned the old strings
 * on portfolio items, lost renames, and could half-complete. Rename, merge and
 * delete arrive with the unified tag system (plan phase 3), where items reference
 * tags by id and those operations are safe.
 *
 *   POST /api/admin/tags/:tagType/terms   { label }
 *   200 { tagType, tags }   404 no such category   409 already exists (any category)   400 invalid
 */
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function addTermToCategory(req, res) {
    try {
        const tagType = String(req.params.tagType || '').trim();
        let label = String(req.body?.label ?? '').replace(/\s+/g, ' ').trim();

        if (!label) return res.status(400).json({ message: 'A tag label is required.' });
        if (label.length > 60) return res.status(400).json({ message: 'Keep tag labels under 60 characters.' });
        // Tags are split on commas when they reach the public filters, so a comma
        // inside a label would silently become two tags that match nothing.
        if (label.includes(',')) return res.status(400).json({ message: 'Tag labels cannot contain commas.' });

        // Same convention the category creator uses.
        label = label.charAt(0).toUpperCase() + label.slice(1);

        const category = await Tags.findOne({ tagType: new RegExp(`^${escapeRegex(tagType)}$`, 'i') });
        if (!category) return res.status(404).json({ message: `No tag category named "${tagType}".` });

        // Case-insensitive across EVERY category. Public matching is exact, so
        // "haldi" beside "Haldi" would split the same work across two rows.
        const clash = await Tags.findOne({ tags: new RegExp(`^${escapeRegex(label)}$`, 'i') }, { tagType: 1, tags: 1 });
        if (clash) {
            const existing = clash.tags.find((t) => t.toLowerCase() === label.toLowerCase());
            return res.status(409).json({
                message: `"${existing}" already exists in ${clash.tagType}.`,
                existing, existingIn: clash.tagType,
            });
        }

        const updated = await Tags.findOneAndUpdate(
            { _id: category._id },
            { $addToSet: { tags: label } },
            { new: true },
        );
        return res.status(200).json({ tagType: updated.tagType, tags: updated.tags });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// it will add new tag in existing category or delete some tag 
async function verifyTagInExistingCategory(req, res, next) {
    try {
        if (!req.body.allTags) {
            return res.status(400).json({ message: "Incomplete field" })
        }
        let { allTags } = req.body;
        allTags = allTags.map((tagDetail) => {
            return {
                tagType: tagDetail.tagType.charAt(0).toUpperCase() + tagDetail.tagType.slice(1),
                tags: tagDetail.tags.map((t) => {
                    if (t.split("-").length) {
                        let upperT = t.split("-").map((t) => t.charAt(0).toUpperCase() + t.slice(1));
                        upperT = upperT.join("-");
                        return upperT
                    } else {
                        return t.charAt(0).toUpperCase() + t.slice(1);
                    }
                })
            }
        })
        // some tag may be deleted or some new tags added we have to check does deleted tag is used in media if yes than we have to  take permission to delete it & from all media inc all videos & phoos  
        const tags = await Tags.find();
        // check if some category has deleted 
        const deletedCat = [];
        tags.forEach((t) => {
            if (!allTags.find((tg) => tg.tagType === t.tagType)) {
                deletedCat.push(t);
            }
        })
        // may be some tag deleted 
        const deletedTagArr = [];
        tags.forEach((t) => {
            const tagsArr = t.tags;
            const newTagType = allTags.find((tg) => tg.tagType === t.tagType);
            if (newTagType) {
                tagsArr.forEach((tgg) => {
                    const arr = []
                    if (!newTagType.tags.find((tg) => tg === tgg)) {
                        arr.push(tgg);
                    }
                    if (arr.length) {
                        deletedTagArr.push({ "tagType": t.tagType, "tags": [...arr] })
                    }
                })
            }
        })
        // merge all deleted tags bec we have save only tag not tagType
        let allDeletedTag = [];
        if (deletedCat.length) {
            deletedCat.forEach((d) => {
                allDeletedTag = [...allDeletedTag, ...d.tags]
            })
        }
        if (deletedTagArr.length) {
            deletedTagArr.forEach((d) => {
                allDeletedTag = [...allDeletedTag, ...d.tags]
            })
        }
        if (req.body.isConfirmed) {
            res.locals.allDeletedTag = allDeletedTag;
            return updateTagInExistingCategory(req, res, next);
        }
        if (allDeletedTag.length) {
            const allClients = await clientSchema.find({
                $or: [
                    { 'videos.tags': { $in: allDeletedTag } },
                    { 'photos.tags': { $in: allDeletedTag } }
                ]
            });
            if (allClients.length) {
                return res.status(200).json({ confirm: "Many of video & photos have use tag that you have deleted , Do you want to delete Tag from them too." })
            }
        }
        await Tags.deleteMany()
        for (const t of allTags) {
            await Tags.create({
                tagType: t.tagType, tags: t.tags
            });
        }
        res.status(200).json({ message: 'UPDATED!' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
async function updateTagInExistingCategory(req, res, next) {
    try {
        if (!res.locals.allDeletedTag) {
            return res.status(400).json({ message: "Incomplete field" })
        }
        const allDeletedTag = res.locals.allDeletedTag;
        if (allDeletedTag.length) {
            const allClient = await clientSchema.find({
                $or: [
                    { 'videos.tags': { $in: allDeletedTag } },
                    { 'photos.tags': { $in: allDeletedTag } }
                ]
            });

            // check can we update all video & photo tag array mean tag array should not empty if yes than we will delere tag from each video & photo else we cant  
            for (const client of allClient) {
                let shouldVideoUpdate = false, shouldPhotoUpdate = false

                // Handle videos
                client.videos.forEach(video => {
                    const remainingTags = video.tags.filter(tag => !allDeletedTag.includes(tag));
                    if (remainingTags.length > 0) {
                        shouldVideoUpdate = true;
                    }
                });

                // Handle photos
                client.photos.forEach(photo => {
                    const remainingTags = photo.tags.filter(tag => !allDeletedTag.includes(tag));
                    if (remainingTags.length > 0) {
                        shouldPhotoUpdate = true;
                    }
                });
                // `&&` here meant a client with videos but no photos (or the
                // reverse) failed the check and blocked the whole delete, even
                // though its media were fine. Only one populated side needs to
                // survive.
                const hasVideos = (client.videos || []).length > 0;
                const hasPhotos = (client.photos || []).length > 0;
                const videosOk = !hasVideos || shouldVideoUpdate;
                const photosOk = !hasPhotos || shouldPhotoUpdate;
                if (!(videosOk && photosOk)) {
                    return res.status(200).json({ message: "Sorry, we can't delete tag because media should have atleast one tag keyword." })
                }
            }
            // if we reach here it means we can update it 
            for (const client of allClient) {
                let shouldVideoUpdate = false, shouldPhotoUpdate = false

                client.videos.forEach(video => {
                    const remainingTags = video.tags.filter(tag => !allDeletedTag.includes(tag));

                    if (remainingTags.length > 0) {
                        video.tags = remainingTags;
                        shouldVideoUpdate = true;
                    }
                });

                client.photos.forEach(photo => {
                    const remainingTags = photo.tags.filter(tag => !allDeletedTag.includes(tag));

                    if (remainingTags.length > 0) {
                        photo.tags = remainingTags;
                        shouldPhotoUpdate = true;
                    }
                });
                // Same bug on the write side: a client with only photos was
                // never saved, so its tags were never actually pruned.
                if (shouldVideoUpdate || shouldPhotoUpdate) {
                    await client.save();
                }
            }
            // we have to remove tag from website setting too
            await websiteSettingsSchema.updateMany(
                { filmsPageVideoTags: { $in: allDeletedTag } },
                { $pull: { filmsPageVideoTags: { $in: allDeletedTag } } }
            );
            await websiteSettingsSchema.updateMany(
                { homepageVideosTags: { $in: allDeletedTag } },
                { $pull: { homepageVideosTags: { $in: allDeletedTag } } }
            );
            // photoPagePhotoTags was omitted here, so deleted tags lingered in
            // the gallery curation list forever.
            await websiteSettingsSchema.updateMany(
                { photoPagePhotoTags: { $in: allDeletedTag } },
                { $pull: { photoPagePhotoTags: { $in: allDeletedTag } } }
            );
            // Portfolio items carry their own copy of the tag strings.
            const PortfolioItem = (await import('../Models/PortfolioItem.js')).default;
            await PortfolioItem.updateMany(
                { tags: { $in: allDeletedTag } },
                { $pull: { tags: { $in: allDeletedTag } } }
            );

            // now we have to remove tag from Tag schema
            await Tags.updateMany(
                { tags: { $in: allDeletedTag } },
                { $pull: { tags: { $in: allDeletedTag } } }
            );
            // delete if some tag array will become empty 
            await Tags.deleteMany({ tags: { $size: 0 } });

            res.status(200).json({ message: 'All tag has been deleted' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
/*************************************************/

// it will add new tag to show on home page below hero banner
async function addNewTagOnHomePage(req, res, next) {
    {
        try {
            if (!req.body.newAddedTags) {
                return res.status(400).json({ message: "INCOMPLETE FIELD" })
            }
            let { newAddedTags } = req.body
            const settings = await websiteSettingsSchema.findOne();
            if (!settings) {
                await websiteSettingsSchema.create({
                    homepageVideosTags: newAddedTags
                })
                return { isValid: true, message: 'TAGS ADDED SUCCESSFULLY' }
            }
            settings.homepageVideosTags = newAddedTags;
            await settings.save();
            res.status(200).json({ tags: settings.homepageVideosTags })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: error.message })
        }
    }
}
// it will add new tag on film page
/**
 * POST /api/admin/photopage/tags — gallery tag-row curation.
 *
 * `photoPagePhotoTags` has existed on the schema all along with no read, no
 * write and no UI, so the gallery could never be curated the way films can.
 */
async function addNewTagOnPhotoPage(req, res, next) {
    try {
        if (!req.body.newAddedTags) {
            return res.status(400).json({ message: "Invalid field" })
        }
        const { newAddedTags } = req.body
        const settings = await websiteSettingsSchema.findOne();
        if (!settings) return res.status(404).json({ message: "Settings not found" })
        settings.photoPagePhotoTags = newAddedTags;
        await settings.save();
        return res.status(200).json({ tags: settings.photoPagePhotoTags })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}

async function addNewTagOnFilmPage(req, res, next) {
    {
        try {
            if (!req.body.newAddedTags) {
                return res.status(400).json({ message: "INCOMPLETE FIELD" })
            }
            let { newAddedTags } = req.body
            const settings = await websiteSettingsSchema.findOne();
            if (!settings) {
                await websiteSettingsSchema.create({
                    filmsPageVideoTags: newAddedTags
                })
                return { isValid: true, message: 'TAGS ADDED SUCCESSFULLY' }
            }
            settings.filmsPageVideoTags = newAddedTags;
            await settings.save();
            res.status(200).json({ tags: settings.filmsPageVideoTags })
        } catch (error) {
            console.log(error)
            res.status(500).json({ message: error.message })
        }
    }
}

/**
 * Middleware for the three page-row setters: once the tag system exists, every
 * row must name a real tag (label, slug or old name). Rows were free strings,
 * so a typo made a row that silently showed nothing.
 */
async function requireKnownRowTags(req, res, next) {
    try {
        const rows = req.body?.newAddedTags;
        if (!Array.isArray(rows) || !rows.every((r) => typeof r === 'string')) {
            return res.status(400).json({ message: 'newAddedTags must be a list of tag names' });
        }
        if (await taxonomyExists()) {
            const unknown = [];
            for (const r of rows) if (!(await resolveTagParam([r])).length) unknown.push(r);
            if (unknown.length) return res.status(400).json({ message: `No tag called ${unknown.map((u) => `"${u}"`).join(', ')}`, unknown });
        }
        return next();
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

/** The old category editor's writes, once the tag manager has replaced them. */
async function retiredOnceTaxonomy(req, res, next) {
    if (!(await taxonomyExists())) return next();
    console.warn(`[410] retired tag write (tag manager exists): ${req.method} ${req.originalUrl}`);
    return res.status(410).json({ message: 'Tags are managed in Settings › Portfolio Tags now.', retired: true });
}

export { requireKnownRowTags, retiredOnceTaxonomy, getAllTags, addNewTagCategory, verifyTagInExistingCategory, updateTagInExistingCategory, addNewTagOnHomePage, addNewTagOnFilmPage, addNewTagOnPhotoPage, addTermToCategory }
