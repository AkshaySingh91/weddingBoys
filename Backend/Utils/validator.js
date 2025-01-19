import jwt from 'jsonwebtoken'
import { COOKIE_NAME } from "../constants.js";
import { config } from "dotenv";
import adminSchema from '../Models/adminSchema.js';
import { checkInviteCode } from './inviteCode.js';
import { putObjectUrl } from '../Controllers/awsController.js';
import * as uuid from 'uuid';
config();

function verifyToken(req, res, next) {
    let token = req.signedCookies[COOKIE_NAME.session_token];
    token = token ? token.trim() : null;
    if (token) {
        try {
            const { name, email, phone } = jwt.verify(token, process.env.JWT_SECRET_KEY);
            res.locals.jwtPayload = { name, email, phone };
            next();
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
    else {
        res.status(400).json({ message: 'UNAUTHENTICATE USER' });
    }
}
const signupValidator = async (req, res, next) => {
    if (req.body.name && req.body.email && req.body.password && req.body.phone && req.body.code && req.body.avatarMetaData && req.body.rememberMe && req.body.avatarMetaData.type && req.body.avatarMetaData.size && req.body.avatarMetaData.name) {

        const { name, email, password, phone, code, avatarMetaData, rememberMe } = req.body;
        const imageType = ['image/jpg', 'image/jpeg', 'image/png'];
        if (!imageType.includes(avatarMetaData.type)) {
            return res.status(400).json({ message: `AVATAR SHOULD IMAGE 'image/jpg', 'image/jpeg', 'image/png'` });
        } else if (avatarMetaData.size / (1024 * 1024) > 10) {
            return res.status(400).json({ message: 'FILE SHOULD LESS THAN 10MB' });
        }
        if (Number.parseInt(rememberMe) === NaN) {
            return res.status(400).json({ message: 'Remember me should no' });
        }
        const validateName = () => {
            const nameRegex = /^[a-zA-Z][a-zA-Z\s'-]{1,49}$/;
            return nameRegex.test(name);
        };
        const validatePhone = () => {
            const phoneRegex = /^\+91 ?\d{10}$/;
            return phoneRegex.test(phone);
        };

        const validateEmail = () => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePassword = () => {
            // min 8 letter + 1 spec symb + 1 no
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
            return passwordRegex.test(password);
        };
        if (!validateName()) {
            return res.status(400).json({ message: 'INVALID NAME' });
        } else if (!validatePhone()) {
            return res.status(400).json({ message: 'INVALID PHONE' });
        } else if (!validateEmail()) {
            return res.status(400).json({ message: 'INVALID EMAIL' });
        } else if (!validatePassword()) {
            return res.status(400).json({ message: 'Password must have minimum eight characters, at least one uppercase letter, one lowercase letter and one number' });
        }
        try {
            const admin = await adminSchema.findOne({ $or: [{ email }, { phone }] });
            if (admin) {
                return res.status(400).json({ "message": 'YOU ALREADY EXIST', admin })
                // check invite code vry imp
            } else if (await checkInviteCode(code)) {
                // if code is correct send put url 
                const avatarKey = `admin/images/${uuid.v4()}.${avatarMetaData.type.split("/")[1]}`;
                const putUrl = await putObjectUrl(avatarKey, avatarMetaData.type, 60 * 30)
                return res.status(200).json({ message: 'Code is correct', putUrl, avatarKey });
            }
        } catch (error) {
            return res.status(400).json({
                "message": error.message
            })
        }
    } else {
        return res.status(400).json({ message: "INCOMPLETE FIELD" })
    }
}
const loginValidator = (req, res, next) => {
    const { email, password } = req.body; 
    const validateEmail = () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };
    const validatePassword = () => {
        // min 8 letter + 1 spec symb + 1 no
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
        return passwordRegex.test(password);
    }
    if (!validateEmail()) {
        return res.status(400).json({ message: 'INVALID EMAIL FORMAT' });
    } else if (!validatePassword()) {
        return res.status(400).json({ message: 'Password must have minimum eight characters, at least one uppercase letter, one lowercase letter and one number' });
    } else {
        next()
    }
}
export { signupValidator, loginValidator, verifyToken }