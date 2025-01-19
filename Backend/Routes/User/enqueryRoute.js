import express from 'express'
import EnquirySchema from '../../Models/EnquirySchema.js';
const Route = express.Router();

async function submitClientEnquiry(req, res, next) {
    try {
        const validateEmail = (email) => {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            return emailRegex.test(email);
        };
        const validatePhone = (phone) => {
            const phoneRegex = /^[0-9]{10}$/;
            return phoneRegex.test(phone);
        };
        if (req.body.bride && req.body.bride.trim() && req.body.groom && req.body.groom.trim() && req.body.contact && req.body.contact.trim() && req.body.reach && req.body.reach.trim() && req.body.eventDate && req.body.eventDate.start && req.body.eventDate.start.trim() && req.body.eventDate.end && req.body.eventDate.end.trim() && (validateEmail(req.body.contact) || validatePhone(req.body.contact))) {

            const details = req.body;
            await EnquirySchema.create({
                Bride: details.bride,
                Groom: details.groom,
                Contact: details.contact,
                Date: details.eventDate,
                Reach: details.reach,
                isViewed: false,
                SubmittedTime: new Date(Date.now()).toLocaleDateString()
            })
            res.status(200).json({ message: "Enquiry Submited!" })
        } else {
            res.status(400).json({ message: "Invalid Field" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}

Route.post("/api/enquiry", submitClientEnquiry)

export default Route