import Tags from '../Models/TagsSchema.js'
import websiteSettingsSchema from "../Models/WebsiteSettingSchema.js"
import clientSchema from "../Models/ClientSchema.js"
// this will get all tag with their category
async function getAllTags(req, res, next) {
    try {
        const allTags = await Tags.find();
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
                if (!(shouldVideoUpdate && shouldPhotoUpdate)) {
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
                if (shouldVideoUpdate && shouldPhotoUpdate) {
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

export { getAllTags, addNewTagCategory, verifyTagInExistingCategory, updateTagInExistingCategory, addNewTagOnHomePage, addNewTagOnFilmPage }
