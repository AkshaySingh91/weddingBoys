import express from "express"
import inviteCodeSchema from "../../Models/inviteCodeSchema.js"
import authenticateAdmin from '../../Middleware/authenticateAdmin.js';
import { nanoid } from "nanoid";
import * as uuid from "uuid"
import adminSchema from "../../Models/adminSchema.js"
import websiteSettingSchema from "../../Models/WebsiteSettingSchema.js"
import { putObjectUrl, deleteObject } from "../../Controllers/awsController.js"

const Route = express.Router();
Route.use(authenticateAdmin)

async function getAdminInviteCode(req, res, next) {
    try {
        const inviteCode = await inviteCodeSchema.findOne().lean();
        if (!inviteCode) {
            return res.status(500).json({ message: "No invite code found" })
        }
        const months = [
            "January", "February",
            "March", "April", "May",
            "June", "July", "August",
            "September", "October",
            "November", "December"
        ];
        let date = `${new Date(inviteCode.expiresAt).getDate()} ${months[new Date(inviteCode.expiresAt).getMonth()]} ${new Date(inviteCode.expiresAt).getFullYear()}`
        const isValid = inviteCode.expiresAt > Date.now();
        if (inviteCode.createdBy) {
            const codeCreator = await adminSchema.findById(inviteCode.createdBy.toString());
            if (codeCreator) {
                inviteCode.createdBy = codeCreator.name;
            } else {
                inviteCode.createdBy = 'Not Found';
            }
        } else if (inviteCode.createdBy === null) {
            inviteCode.createdBy = "Developer"
        }

        inviteCode.date = date;
        inviteCode.isValid = isValid;
        res.status(200).json({ inviteCode })
    } catch (error) {
        res.status(400).json({ message: error.message })
    }
}

async function regenerateAdminInviteCode(req, res, next) {
    try {
        if (!req.admin) {
            return res.status(400).json({ message: "Admin not found" });
        }
        const admin = await adminSchema.findOne({ $or: [{ name: req.admin.name }, { email: req.admin.email }, { phone: req.admin.phone }] })
        if (!admin) {
            return res.status(400).json({ message: "Admin not found" });
        }
        await inviteCodeSchema.deleteMany()
        const expiresAt = new Date(Date.now() + (60 * 24 * 60 * 60 * 1000));
        console.log(expiresAt.getMonth(), expiresAt.getFullYear())
        await inviteCodeSchema.create({
            code: nanoid(), createdBy: admin._id, expiresAt
        })
        res.status(200).json({ message: "Created!" })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/admin/studio-setting/invite-code", getAdminInviteCode)
Route.get("/api/admin/studio-setting/invite-code/regenerate", regenerateAdminInviteCode)
/*****************************************************/

async function getStudioLogoPutUrl(req, res, next) {
    try {
        if (req.body.studioLogoMetaData && req.body.studioLogoMetaData.name && req.body.studioLogoMetaData.size && req.body.studioLogoMetaData.type && req.body.isLogoUpdated) {
            const { studioLogoMetaData } = req.body;
            const imagetype = ["image/png", "image/jpg", "image/jpeg", "image/svg+xml"];
            if (imagetype.includes(studioLogoMetaData.type)) {
                //  now all details are verified send put url
                const key = `admin/images/${uuid.v4()}.${studioLogoMetaData.type.split("/")[1]}`
                const url = await putObjectUrl(key, studioLogoMetaData.type)
                res.status(200).json({ putUrl: url, key });
            } else {
                return res.status(400).json({ message: 'LOGO SHOULD IMAGE ' })
            }
        }
        else {
            return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
async function saveStudioContactDetails(req, res, next) {
    try {
        const setting = await websiteSettingSchema.findOne()
        if (!setting) {
            // admin/images/b39a870f-d551-41d6-80a3-9ff8d2215056.png
            return res.status(400).json({ message: 'Studio Setting NOT FOUND' })
        }
        if (req.body.isLogoUpdated && req.body.key && req.body.key.trim()) {
            if (setting.companyDetails.companyLogo && setting.companyDetails.companyLogo.key) {
                const oldKey = setting.companyDetails.companyLogo.key;
                await deleteObject(oldKey);
            }
            setting.companyDetails = {
                ...setting.companyDetails,
                companyLogo: { key: req.body.key }
            }
            await setting.save();
            return res.status(200).json({ message: "Studio Logo updated" })
        } else if (req.body.isLogoUpdated === false) {
            if (req.body.studioDetail &&
                req.body.studioDetail.studioName && req.body.studioDetail.studioName.trim() &&
                Array.isArray(req.body.studioDetail.studioContact) && req.body.studioDetail.studioContact.length === 2 &&
                req.body.studioDetail.studioEmail && req.body.studioDetail.studioEmail.trim() &&
                req.body.studioDetail.studioAddress && req.body.studioDetail.studioAddress.trim() &&
                (req.body.studioDetail.studioSocials && req.body.studioDetail.studioSocials.instagram && req.body.studioDetail.studioSocials.youtube && req.body.studioDetail.studioSocials.x && req.body.studioDetail.studioSocials.facebook && req.body.studioDetail.studioSocials.instagram.trim() && req.body.studioDetail.studioSocials.youtube.trim() && req.body.studioDetail.studioSocials.x.trim() && req.body.studioDetail.studioSocials.facebook.trim())
            ) {
                const { studioDetail } = req.body;
                const validateEmail = () => {
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    return emailRegex.test(studioDetail.studioEmail);
                };
                const validatePhone = (phone) => {
                    const phoneRegex = /^\+91 ?\d{10}$/;
                    return phoneRegex.test(phone);
                };
                if (!validateEmail()) {
                    return res.status(400).json({ message: 'INVALID EMAIL' });
                } else if (!validatePhone(studioDetail.studioContact[0]) || !validatePhone(studioDetail.studioContact[0])) {
                    return res.status(400).json({ message: 'INVALID PHONE' });
                }
                console.log({ studioDetail })
                setting.companyDetails = {
                    ...setting.companyDetails,
                    companyName: studioDetail.studioName,
                    companySocial: {
                        instagram: studioDetail.studioSocials.instagram,
                        youtube: studioDetail.studioSocials.youtube,
                        x: studioDetail.studioSocials.x,
                        facebook: studioDetail.studioSocials.facebook,
                    },
                    address: studioDetail.studioAddress,
                    email: studioDetail.studioEmail,
                    phone: studioDetail.studioContact
                }
                await setting.save()
                return res.status(200).json({ message: "Details updated" })
            }
            else {
                return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
            }
        } else {
            return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: error.message })
    }
}
Route.put("/api/admin/studio-setting/contact/save", saveStudioContactDetails)
Route.put("/api/admin/studio-setting/contact/get-logo-put-url", getStudioLogoPutUrl)

export default Route;