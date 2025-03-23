import adminSchema from "../Models/adminSchema.js";
import bcrypt from 'bcrypt'
import tokenGenerator from '../Utils/tokenGenerator.js'
import { config } from "dotenv";
import { COOKIE_NAME } from "../constants.js";
import { sendEmailOtp, sendSmsOtp, generateOtp } from "../Utils/otpSender.js";
import otpSchema from "../Models/otpSchema.js";
config();


// this will verify newliy generate otp that is save in otpSchema 
async function verifyOtp(req, res, next) {
    const { target, otp } = req.body;
    try {
        const record = await otpSchema.findOne({ target, otp });
        if (!record) {
            return res.status(400).json({ message: "Invalid OTP" });
        } else if (record.expiresAt < new Date()) {
            await otpSchema.deleteOne({ _id: record._id });
            return res.status(400).json({ message: "Expired OTP" });
        }
        // OTP is valid 
        await otpSchema.deleteOne({ _id: record._id }); // Remove OTP after successful verification
        res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
// this will generate new otp of type sms or email & save otp in schema
async function requestOtp(req, res, next) {
    const { target, type, name } = req.body;
    // target = abc@gmail.com or 121312313  type = sms or email
    let newOtp = {};
    if (!target || !type) {
        return res.status(400).json({ message: 'FIELD INCOMPLETE' });
    }
    try {
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes
        //save otp in DB
        newOtp = await otpSchema.create({
            otp, expiresAt, target
        })
        if (type === 'email') {
            sendEmailOtp(target, otp, name)
        } else if (type === 'sms') {
            sendSmsOtp(target, otp)
        } else {
            res.status(400).json({ message: 'INVALID OTP REQUEST' });
        }
        res.status(200).json({ message: "OTP sent successfully" });
    } catch (error) {
        otpSchema.deleteOne({ _id: newOtp?._id })
        res.status(500).json({ message: error.message });
    }


}
// this will save admin details after otp verification & uploding avatar
async function adminSignup(req, res, next) {
    if (req.body.name && req.body.email && req.body.password && req.body.phone && req.body.rememberMe && req.body.avatarKey) {
        const { name, email, password, phone, rememberMe, avatarKey } = req.body;
        try {
            const salt = await bcrypt.genSalt(10)
            const hashedPassword = await bcrypt.hash(password, salt)

            await adminSchema.create({
                name, email, phone, password: hashedPassword, avatar: { key: avatarKey }
            });
            // generate session token & save in cookiee
            const sessionToken = tokenGenerator({ name, email, phone, role: 'admin' }, `${rememberMe}d`)
            const expires = new Date(Date.now() + Number.parseInt(rememberMe) * 24 * 60 * 60 * 1000);
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
            res.status(201).json({ "message": 'OK', admin: { name, email, phone, role: "admin" } })
        } catch (error) {
            return res.status(500).json({ message: error.message })
        }
    } else {
        return res.status(400).json({ "message": 'INCOMPLETE FIELD AFTER UPLOADING AVATAR' })
    }
}
/*********************************************************/

// it will generate new session cookie after email otp verification 
async function adminLogin(req, res, next) {
    try {
        const { email, password, rememberMe } = req.body;
        const admin = await adminSchema.findOne({ email });
        if (!admin) {
            return res.status(400).json({
                "message": 'INVALID EMAIL OR PASSWORD'
            })
        }
        const adminHashedPassword = admin.password
        const isPasswordCorrect = await bcrypt.compare(password, adminHashedPassword)

        if (!isPasswordCorrect) {
            return res.status(400).json({
                "message": 'INVALID EMAIL OR PASSWORD'
            })
        }
        const sessionToken = tokenGenerator({ name: admin.name, role: 'admin', phone: admin.phone, email: admin.email }, `${rememberMe}d`)
        const expires = new Date(Date.now() + Number.parseInt(rememberMe) * 24 * 60 * 60 * 1000);

        res.cookie(COOKIE_NAME.session_token, sessionToken, {
            httpOnly: true,
            domain: 'localhost',
            path: '/',
            signed: true,
            expires
        })
        return res.status(200).json({
            "message": 'ADMIN LOGGED IN', admin
        })
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            "message": 'SERVER ERROR'
        })
    }
}
/*********************************************************/

// this will check if admin available using email if admin forgot password
async function checkIsAdminAvailable(req, res, next) {
    try {
        const { email, phone } = req.body;
        const validateEmail = () => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePhone = () => {
            const phoneRegex = /^\+91 ?\d{10}$/;
            return phoneRegex.test(phone);
        };
        if (!validatePhone()) {
            return res.status(400).json({
                "message": 'INVALID PHONE'
            })
        } else if (!validateEmail()) {
            return await res.status(400).json({
                "message": 'INVALID EMAIL'
            })
        }
        const admin = await adminSchema.findOne({ $and: [{ email, phone }] });
        if (!admin) {
            res.status(400).json({
                "message": 'ADMIN DOES NOT EXIST'
            })
            return;
        }
        return res.status(200).json({
            "message": 'ADMIN EXIST', admin
        })
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            "message": 'SERVER ERROR'
        })
    }
}
// this will update password if admin forgot previous one after both email & phone verification
async function updatePassword(req, res, next) {
    try {
        const { phone, email, password } = req.body;
        const validateEmail = () => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePhone = () => {
            const phoneRegex = /^\+91 ?\d{10}$/;
            return phoneRegex.test(phone);
        };
        const validatePassword = () => {
            // min 8 letter + 1 spec symb + 1 no
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            return passwordRegex.test(password);
        };
        if (!validatePhone()) {
            return res.status(400).json({
                "message": 'INVALID PHONE'
            })
        } else if (!validateEmail()) {
            return await res.status(400).json({
                "message": 'INVALID EMAIL'
            })
        } else if (!validatePassword()) {
            return await fireMessage('Password must have minimum eight characters, at least one uppercase letter, one lowercase letter and one number', 'error')
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
        const admin = await adminSchema.findOneAndUpdate({ $and: [{ email, phone }] }, {
            password: hashedPassword
        });
        if (!admin) {
            res.status(400).json({
                "message": 'ADMIN DOES NOT EXIST'
            })
            return;
        }
        return res.status(200).json({
            "message": 'PASSWORD UPDATED', admin
        })
    } catch (error) {
        console.log(error.message)
        res.status(200).json({
            "message": 'SERVER ERROR'
        })
    }
}
/*********************************************************/

// it will use as frontend middleware to check if routing person is admin or not
async function adminAuthStatus(req, res, next) {
    const token = req.signedCookies[COOKIE_NAME.session_token]?.trim();
    if (token) {
        try {
            const { name, email, phone } = res.locals.jwtPayload;
            // verify admin
            const admin = await adminSchema.findOne({ $and: [{ name, email, phone }] }).lean();
            if (!admin) {
                return res.status(400).json({ message: 'ADMIN NOT FOUND' });
            }
            res.status(200).json({ message: 'VALID ADMIN', admin });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    else {
        res.status(400).json({ message: 'UNAUTHENTICATE ADMIN' });
    }
}
/*********************************************************/

// clear sesssion cookiee
async function adminLogout(req, res, next) {
    const token = req.signedCookies[COOKIE_NAME.session_token]?.trim();
    if (token) {
        try {
            res.clearCookie(COOKIE_NAME.session_token, {
                httpOnly: true,
                domain: 'localhost',
                path: '/',
            })
            res.status(201).json({ message: 'LOGOUT SUCCESSFULLY' });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    else {
        res.status(400).json({ message: 'UNAUTHENTICATE admin' });
    }
}

export { adminSignup, adminLogin, adminAuthStatus, adminLogout, requestOtp, verifyOtp, checkIsAdminAvailable, updatePassword }