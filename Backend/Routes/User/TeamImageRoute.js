import express from "express"
const Route = express.Router();
import { getObjectUrl } from "../../Controllers/awsController.js"

import { mediaUrlForKey, resolveNode } from '../../Utils/mediaUrl.js';
// Prefer the immutable R2 CDN URL for any asset already migrated; fall back to a
// signed S3 URL while the migration is in flight. Lookups are batched, so a page
// of assets costs one query, not one per asset.
const mediaUrl = (key) => mediaUrlForKey(key, getObjectUrl);

import TeamSchema from "../../Models/TeamSchema.js"
import Media from "../../Models/Media.js"

// Responsive image facts for R2-uploaded portraits: the webp ladder, blur
// placeholder and size, so pages can serve srcset instead of the master.
const imageFacts = (m) => m ? {
    width: m.width || null,
    height: m.height || null,
    blurDataURL: m.blurDataURL || null,
    dominantColor: m.dominantColor || null,
    variants: (m.imageVariants || []).filter((v) => v.format === 'webp' && v.url)
        .map((v) => ({ width: v.width, height: v.height, url: v.url }))
        .sort((a, b) => a.width - b.width)
        // The ladder never enlarges, so small masters repeat their own width.
        .filter((v, i, list) => i === 0 || v.width !== list[i - 1].width),
} : {}

async function getTeamImage(req, res, next) {
    try {
        const images = await TeamSchema.find().lean();
        const ids = images.map((i) => i.imageMetaData?.mediaId).filter(Boolean);
        const media = new Map((await Media.find({ mediaId: { $in: ids } })
            .select('mediaId width height blurDataURL dominantColor imageVariants').lean()).map((m) => [m.mediaId, m]));
        let teamImages = [];
        let bannerImage = [];
        for (const i of images) {
            // A new upload has only a mediaId; a migrated/legacy one has a key.
            if (i.imageMetaData?.mediaId || i.imageMetaData?.key?.trim()) {
                const url = await resolveNode(i.imageMetaData, getObjectUrl);
                if (i.isHero) {
                    bannerImage.push({
                        ...i,
                        _id: i._id.toString(),
                        url,
                        ...imageFacts(media.get(i.imageMetaData?.mediaId)),
                    })
                } else {
                    teamImages.push({
                        ...i,
                        _id: i._id.toString(),
                        url,
                        ...imageFacts(media.get(i.imageMetaData?.mediaId)),
                    })
                }
            }
        }
        res.status(200).json({ teamImages, bannerImage })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/team", getTeamImage)

export default Route;