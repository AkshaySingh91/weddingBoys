import express from "express"
const Route = express.Router();
import { getObjectUrl } from "../../Controllers/awsController.js"

import TeamSchema from "../../Models/TeamSchema.js"

async function getTeamImage(req, res, next) {
    try {
        const images = await TeamSchema.find().lean();
        let teamImages = [];
        let bannerImage = [];
        for (const i of images) {
            if (i.imageMetaData.key && i.imageMetaData.key.trim()) {
                const url = await getObjectUrl(i.imageMetaData.key);
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