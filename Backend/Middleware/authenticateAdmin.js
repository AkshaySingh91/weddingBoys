import jwt from 'jsonwebtoken';
import { COOKIE_NAME } from "../constants.js";

// it is backend middleware use to protect backend route by checking session cookiee 
export default function authenticateAdmin(req, res, next) {
    const sessionToken = req.signedCookies[COOKIE_NAME.session_token];
    if (!sessionToken) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    try {
        const payload = jwt.verify(sessionToken, process.env.JWT_SECRET_KEY);
        if (!payload || !payload.email || payload.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admin access only' });
        }
        req.admin = payload; // Attach admin details to the request object 
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
};
