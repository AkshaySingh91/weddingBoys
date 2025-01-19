import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'
import EnquirySchema from '../../Models/EnquirySchema.js';

const clientEnquiryRoute = express.Router();
clientEnquiryRoute.use(authenticateAdmin)

async function getAllClientEnquiry(req, res, next) {
    try {
        const allInquiries = await EnquirySchema.find();
        return res.status(200).json({ allInquiries })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

clientEnquiryRoute.get("/admin/api/get-clients-enquiry", getAllClientEnquiry)
async function markViewToClientEnquires(req, res, next) {
    try {
        const enquiryId = req.params;
        if (enquiryId.id && enquiryId.id.trim()) {
            await EnquirySchema.findByIdAndUpdate(enquiryId.id, {
                isViewed: true
            })
            res.status(200).json({ message: "view updated!" })
        } else {
            res.status(400).json({ message: "Id not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
clientEnquiryRoute.patch("/admin/api/enquires/mark-viewed/:id", markViewToClientEnquires)

async function deleteClientEnquiry(req, res, next) {
    try {
        const enquiryId = req.params;
        if (enquiryId.id && enquiryId.id.trim()) {
            await EnquirySchema.findByIdAndDelete(enquiryId.id)
            res.status(200).json({ message: "deleted!" })
        } else {
            res.status(400).json({ message: "Id not found" })
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
clientEnquiryRoute.delete("/admin/api/enquires/:id", deleteClientEnquiry)

export default clientEnquiryRoute