import express from 'express'
import WebsiteSettingSchema from '../../Models/WebsiteSettingSchema.js';
import { putObjectUrl, deleteObject } from '../../Controllers/awsController.js'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'
import * as uuid from "uuid"

const Route = express.Router();
Route.use(authenticateAdmin);
// this will add new bts image if uploded image type is valid 
async function generatePutUrlForBtsImg(req, res, next) {
    try {
        if (!req.body.btsMetaData) {
            return res.status(400).json({ message: "Image details required" })
        }
        let { btsMetaData } = req.body
        for (const fileDetail of btsMetaData) {
            const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedFileTypes.includes(fileDetail.type)) {
                return res.status(400).json({ message: "Type should be image " })
            }
        }
        // generate url for each image to upload
        const imgUrls = [];
        for (const fileDetail of btsMetaData) {
            const imgKey = `admin/images/${uuid.v4()}.${fileDetail.type.split('/')[1]}`
            const url = await putObjectUrl(imgKey, fileDetail.type);
            imgUrls.push({
                imageName: fileDetail.name,
                putUrl: url,
                imgKey
            })
        }
        res.status(200).json({ imgUrls })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
// this will save bts image key after uploading 
async function saveBtsImage(req, res, next) {
    try {
        if (!req.body.filesMetaWithKey) {
            return res.status(400).json({ message: "filesMetaWithKey not found" })
        }
        let { filesMetaWithKey } = req.body
        // get keys of img
        const key = [];
        for (const metaData of filesMetaWithKey) {
            key.push({
                photoMetaData: { key: metaData.key }
            })
        }
        const settings = await WebsiteSettingSchema.findOne();
        if (!settings) {
            await WebsiteSettingSchema.create({
                BtsPhotos: key
            })
            return res.status(200).json({ message: 'Image added.' })
        }
        settings.BtsPhotos = [...key, ...settings.BtsPhotos];
        await settings.save();
        return res.status(200).json({ message: 'Image added.' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
// this will delete btsImage 
async function deleteBtsImage(req, res, next) {
    try {
        if (!req.body.key) {
            return res.status(400).json({ message: "Image details required" })
        }
        let { key } = req.body
        await deleteObject(key)
        // delete from DB
        const settings = await WebsiteSettingSchema.findOne();
        if (settings && settings.BtsPhotos && settings.BtsPhotos.length) {
            const remaningImg = settings.BtsPhotos.filter((img) => img.photoMetaData.key !== key)
            settings.BtsPhotos = remaningImg
            await settings.save();
        }
        res.status(200).json({ message: "Image has deleted successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }

}
Route.put("/admin/api/homepage/bts-image/get-url", generatePutUrlForBtsImg)
Route.put("/admin/api/homepage/bts-image/save-details", saveBtsImage)
Route.delete("/admin/api/homepage/bts-image", deleteBtsImage)
/************************************************************************************************/

// this will delete client from map by finding from client id
async function deleteClientFromMap(req, res, next) {
    try {
        if (!req.body.clientId) {
            return res.status(400).json({ message: 'client id required' })
        }
        const { clientId } = req.body
        const clientOnMap = await WebsiteSettingSchema.findOne().select("mapDisplayClient")
        if (!clientOnMap) {
            return res.status(404).json({ message: "Settings not found" });
        }
        if (!clientOnMap.mapDisplayClient.find((c) => c.clientId.toString() === clientId)) {
            return res.status(500).json({ message: "Client not found" });
        } else {
            const remainingClients = clientOnMap.mapDisplayClient.filter(
                (c) => c.clientId.toString() !== clientId
            );
            clientOnMap.mapDisplayClient = remainingClients
            await clientOnMap.save()
        }
        return res.status(200).json({ message: "Client Deleted." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
Route.delete("/admin/api/map-clients", deleteClientFromMap);

export default Route
