import express from "express"
const Route = express.Router();
import { getObjectUrl } from "../../Controllers/awsController.js"

import { mediaUrlForKey, resolveNode } from '../../Utils/mediaUrl.js';
// Prefer the immutable R2 CDN URL for any asset already migrated; fall back to a
// signed S3 URL while the migration is in flight. Lookups are batched, so a page
// of assets costs one query, not one per asset.
const mediaUrl = (key) => mediaUrlForKey(key, getObjectUrl);

import TeamSchema from "../../Models/TeamSchema.js"

async function getTeamImage(req, res, next) {
    try {
        const images = await TeamSchema.find().lean();
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
                    })
                } else {
                    teamImages.push({
                        ...i,
                        _id: i._id.toString(),
                        url,
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