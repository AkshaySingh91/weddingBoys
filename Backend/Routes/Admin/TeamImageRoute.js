import express from "express"
const Route = express.Router();
import authenticateAdmin from "../../Middleware/authenticateAdmin.js"
import { putObjectUrl, deleteObject } from "../../Controllers/awsController.js"
import * as uuid from "uuid"
import TeamSchema from "../../Models/TeamSchema.js"

Route.use(authenticateAdmin)


async function deleteTeamBannerImage(req, res, next) {
    try { 
        if (req.body.id && req.body.id.trim()) {
            const image = await TeamSchema.findById(req.body.id);
            if (!image) {
                return res.status(404).json({ message: "Inmage not foud" })
            }
            if (image.imageMetaData.key) {
                await deleteObject(image.imageMetaData.key);
            }
            await TeamSchema.findByIdAndDelete(req.body.id);
            return res.status(200).json({ message: "Image has deleted." })
        } else {
            res.status(400).json({ message: "Id required" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
Route.delete("/api/admin/team/banner-image", deleteTeamBannerImage)

async function addTeamBannerImage(req, res, next) {
    try {
        if (req.body.imageMeta && req.body.imageMeta.length) {
            const imageType = ["image/jpg", "image/png", "image/jpeg"];
            const imageMeta = req.body.imageMeta;
            for (const img of imageMeta) {
                if (!imageType.includes(img.type)) {
                    return res.status(400).json({ message: "Invalid image type." })
                }
            }
            const imageMetaData = [];
            for (const img of imageMeta) {
                const key = `admin/images/${uuid.v4()}.${img.type.split("/")[1]}`
                const putUrl = await putObjectUrl(key, img.type);
                imageMetaData.push({
                    key, putUrl, ...img
                })
            }
            return res.status(200).json({ imageMetaData })
        } else {
            res.status(400).json({ message: "Invalid field" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
async function saveTeamBannerImage(req, res, next) {
    try {
        if (req.body.uploadedImage && req.body.uploadedImage.length) {
            for (const img of req.body.uploadedImage) {
                if (img.key && img.key.trim()) {
                    await TeamSchema.create({
                        isHero: true,
                        about: null,
                        imageMetaData: {
                            key: img.key
                        }
                    })
                }
            }
            return res.status(200).json({ message: "Image has Added." })
        } else {
            res.status(400).json({ message: "Invalid field" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
Route.post("/api/admin/team/banner-image", saveTeamBannerImage)
Route.post("/api/admin/team/banner-image/get-put-url", addTeamBannerImage)
/***********************************/


async function deleteTeamImage(req, res, next) {
    try {
        if (req.body.id && req.body.id.trim()) {
            const teamMember = await TeamSchema.findById(req.body.id);
            if (!teamMember) {
                return res.status(404).json({ message: "Team member not found." })
            }
            if (teamMember.imageMetaData.key && teamMember.imageMetaData.key.trim()) {
                await deleteObject(teamMember.imageMetaData.key)
            }
            await TeamSchema.findByIdAndDelete(req.body.id);
            res.status(200).json({ message: "Deleted" })
        } else {
            res.status(404).json({ message: "Invalid field" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
async function changeTeamImageDetails(req, res, next) {
    try {
        const { details } = req.body;
        if (
            details?._id?.trim() &&
            details.about?.name?.trim() &&
            details.about?.designation?.trim()
        ) {
            const teamMember = await TeamSchema.findById(details._id);
            if (!teamMember) {
                return res.status(404).json({ message: "Team member not found." });
            }
            await TeamSchema.findByIdAndUpdate(details._id, {
                $set: {
                    "about.name": details.about.name,
                    "about.designation": details.about.designation,
                }
            });

            res.status(200).json({ message: "Updated!" });
        } else {
            res.status(400).json({ message: "Invalid input fields." });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Server Error. Please try again later." });
    }

}
async function addNewTeamImage(req, res, next) {
    try {
        if (req.body.uploadedImage && req.body.uploadedImage.length) {
            for (const img of req.body.uploadedImage) {
                if (img.key && img.key.trim()) {
                    await TeamSchema.create({
                        isHero: false,
                        about: { name: img.name, designation: img.designation },
                        imageMetaData: {
                            key: img.key
                        }
                    })
                }
            }
            return res.status(200).json({ message: "Image has Added." })
        } else {
            res.status(400).json({ message: "Invalid field" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
async function verifyNewTeamImageDetails(req, res, next) {
    try {
        if (req.body.imageMeta && req.body.imageMeta.length) { 
            const imageType = ["image/jpg", "image/png", "image/jpeg"];
            const imageMeta = req.body.imageMeta;
            for (const img of imageMeta) {
                if (!(img.designation && img.designation.trim() && img.name && img.name.trim() && img.fileMeta && img.fileMeta.size && img.fileMeta.name)) {
                    return res.status(400).json({ message: "Incomplete field." })
                }
                if (!imageType.includes(img.fileMeta.type)) {
                    return res.status(400).json({ message: "Invalid image type." })
                }
            }
            const imageMetaData = [];
            for (const img of imageMeta) {
                const key = `admin/images/${uuid.v4()}.${img.fileMeta.type.split("/")[1]}`
                const putUrl = await putObjectUrl(key, img.fileMeta.type);
                imageMetaData.push({
                    key, putUrl, ...img
                })
            }
            return res.status(200).json({ imageMetaData })
        } else {
            res.status(400).json({ message: "Invalid field" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
Route.put("/api/admin/team/", changeTeamImageDetails)
Route.post("/api/admin/team/get-put-url", verifyNewTeamImageDetails)
Route.post("/api/admin/team", addNewTeamImage)
Route.delete("/api/admin/team", deleteTeamImage)


export default Route;