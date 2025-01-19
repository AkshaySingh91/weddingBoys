import express from "express"
import websiteSettingSchema from "../../Models/WebsiteSettingSchema.js";
const Route = express.Router();
import { getObjectUrl } from "../../Controllers/awsController.js"

async function getStudioDetails(req, res, next) {
    try {
        const setting = await websiteSettingSchema.findOne().lean();
        if (setting && setting.companyDetails && setting.companyDetails.companyName && setting.companyDetails.companySocial && setting.companyDetails.companyLogo && setting.companyDetails.address && setting.companyDetails.email && setting.companyDetails.phone && setting.companyDetails.companyLogo.key) {
            const companyDetails = setting.companyDetails;
            const url = await getObjectUrl(companyDetails.companyLogo.key)

            const studioDetails = {
                name: companyDetails.companyName,
                logo: url,
                address: companyDetails.address,
                contact: companyDetails.phone,
                email: companyDetails.email,
                socials: companyDetails.companySocial
            }
            res.status(200).json({ studioDetails })
        } else {
            return res.status(500).json({ message: "Company Details Not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/studio/details", getStudioDetails)

export default Route;