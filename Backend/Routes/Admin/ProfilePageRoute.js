import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js';
import AdminSchema from "../../Models/adminSchema.js"
import { deleteObject, getObjectUrl, putObjectUrl } from "../../Controllers/awsController.js"
import * as uuid from "uuid";
import { COOKIE_NAME } from '../../constants.js';
import tokenGenerator from '../../Utils/tokenGenerator.js';
import bcrypt, { hash } from "bcrypt";

const Route = express.Router();
Route.use(authenticateAdmin)

async function getAdminProfileDetails(req, res, next) {
    try {
        if (req.admin && req.admin.phone && req.admin.email && req.admin.name) {
            const admin = await AdminSchema.findOne({ $and: [{ phone: req.admin.phone }, { email: req.admin.email }] }).lean()
            if (!admin) {
                return res.status(400).json({ message: 'ADMIN NOT FOUND IN DB' })
            } else if (!admin.avatar.key) {
                return res.status(400).json({ message: 'ADMIN AVATAR NOT FOUND IN DB' })
            }
            // get url for avatar 
            const avatar = await getObjectUrl(admin.avatar.key);
            res.status(200).json({
                adminDetail: {
                    name: admin.name, email: admin.email, phone: admin.phone, avatar, _id: admin._id.toString()
                }
            })
        } else {
            return res.status(400).json({ message: 'UNAUTHORIZED ADMIN' })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
async function verifyAdminProfileDetails(req, res, next) {
    try {
        if (req.body.admin && req.body.admin.id && req.body.admin.phone && req.body.admin.email && req.body.admin.name &&
            req.body.admin.id.trim() && req.body.admin.phone.trim() && req.body.admin.email.trim() && req.body.admin.name.trim()) {
            const detail = req.body;
            // validate email & phone
            const validateEmail = () => {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                return emailRegex.test(detail.admin.email);
            };
            const validatePhone = () => {
                const phoneRegex = /^\+91 ?\d{10}$/;
                return phoneRegex.test(detail.admin.phone);
            };
            if (!validateEmail()) {
                return res.status(400).json({ message: 'INVALID EMAIL' });
            } else if (!validatePhone()) {
                return res.status(400).json({ message: 'INVALID PHONE' });
            }
            if (detail.isAvatarUpdated === false) {
                // save details
                return updateAdminProfileDetails(req, res, next);
            }
            else if (detail.isAvatarUpdated && detail.admin.avatarMetaData && detail.admin.avatarMetaData.type && detail.admin.avatarMetaData.size && detail.admin.avatarMetaData.name) {
                const imagetype = ["image/png", "image/jpg", "image/jpeg"];
                if (imagetype.includes(detail.admin.avatarMetaData.type)) {
                    //  now all details are verified send put url
                    const key = `admin/images/${uuid.v4()}.${detail.admin.avatarMetaData.type.split("/")[1]}`
                    const url = await putObjectUrl(key, detail.admin.avatarMetaData.type)
                    res.status(200).json({ putUrl: url, key });
                } else {
                    return res.status(400).json({ message: 'AVATAR SHOULD IMAGE ' })
                }
            }
            else {
                return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
            }

        } else {
            return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
        }
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}
async function updateAdminProfileDetails(req, res, next) {
    try {
        if (req.body.admin && req.body.admin.id && req.body.admin.phone && req.body.admin.email && req.body.admin.name &&
            req.body.admin.id.trim() && req.body.admin.phone.trim() && req.body.admin.email.trim() && req.body.admin.name.trim()) {
            const detail = req.body;
            const prevDetail = await AdminSchema.findById(detail.admin.id).lean()
            if (!prevDetail) {
                return res.status(400).json({ message: 'ADMIN ID NOT FOUND' })
            }
            if (detail.isAvatarUpdated === false || (detail.isAvatarUpdated && detail.admin.key && detail.admin.key.trim())) {
                if (detail.isAvatarUpdated === false) {
                    await AdminSchema.findByIdAndUpdate(detail.admin.id, {
                        name: detail.admin.name,
                        email: detail.admin.email,
                        phone: detail.admin.phone
                    })
                } else {
                    // delete old avatar 
                    const oldKey = prevDetail.avatar.key;
                    await deleteObject(oldKey);
                    await AdminSchema.findByIdAndUpdate(detail.admin.id, {
                        name: detail.admin.name,
                        email: detail.admin.email,
                        phone: detail.admin.phone,
                        avatar: { key: detail.admin.key }
                    })
                }
                // after saving details update session cookiee & save it
                // use 7 day as default time for expire
                const sessionToken = tokenGenerator({ name: detail.admin.name, email: detail.admin.email, phone: detail.admin.phone, role: 'admin' }, `7d`)
                const expires = new Date(Date.now() + Number.parseInt(7) * 24 * 60 * 60 * 1000);
                res.clearCookie(COOKIE_NAME.session_token, {
                    httpOnly: true,
                    domain: 'localhost',
                    path: '/',
                })
                res.cookie(COOKIE_NAME.session_token, sessionToken, {
                    httpOnly: true,
                    domain: 'localhost',
                    path: '/',
                    signed: true,
                    expires
                })
                return res.status(200).json({ message: 'ADMIN DETAIL UPDATED' })
            } else {
                return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
            }
        }
        else {
            return res.status(400).json({ message: 'INCOMPLETE DETAILS' })
        }

    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

async function changeAdminPassword(req, res, next) {
    if (req.admin && req.admin.phone && req.admin.email && req.admin.name) {
        const admin = await AdminSchema.findOne({ $and: [{ phone: req.admin.phone }, { email: req.admin.email }] }).lean()
        // check if routing person is admin 
        if (!admin) {
            return res.status(400).json({ message: 'ADMIN NOT FOUND IN DB' })
        }
        // check is field incomplete
        if (req.body.currentPassword && req.body.newPassword && req.body.confirmPassword && req.body.currentPassword.trim() && req.body.newPassword.trim() && req.body.confirmPassword.trim()) {
            // check if confirm password are same
            if (req.body.newPassword !== req.body.confirmPassword) {
                return res.status(400).json({ message: 'UNMATCH PASSWORD' })
            }
            // check password strength
            const validatePassword = () => {
                const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
                return passwordRegex.test(req.body.newPassword);
            };
            if (!validatePassword()) {
                return res.status(400).json({ message: 'Password must have minimum eight characters, at least one uppercase letter, one lowercase letter and one number' })
            }
            // check if password is correct
            const orignalHashedPassword = admin.password;
            const isSamePassword = await bcrypt.compare(req.body.currentPassword, orignalHashedPassword)
            if (isSamePassword) {
                // hashed new password
                const salt = await bcrypt.genSalt(10);
                const newHashedPassword = await bcrypt.hash(req.body.newPassword, salt);
                // save new password
                await AdminSchema.findOneAndUpdate({ $and: [{ phone: req.admin.phone }, { email: req.admin.email }] }, {
                    password: newHashedPassword
                })
                res.status(200).json({ message: "Password updated !" })
            } else {
                return res.status(400).json({ message: 'INVALID PASSWORD' })
            }
        } else {
            return res.status(400).json({ message: 'INCOMPLETE FIELD' })
        }
    } else {
        return res.status(400).json({ message: 'UNAUTHORIZED ADMIN' })
    }
}
Route.get("/api/admin/profile", getAdminProfileDetails)
Route.put("/api/admin/profile/verify", verifyAdminProfileDetails)
Route.put("/api/admin/profile/save", updateAdminProfileDetails)
Route.post("/api/admin/profile/change-password", changeAdminPassword)

export default Route