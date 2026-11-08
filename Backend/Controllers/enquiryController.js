import { createHash } from 'node:crypto';
import Enquiry from '../Models/EnquirySchema.js';
import { enquirySchema } from '../Utils/enquiryValidation.js';

export async function submitEnquiry(req, res) {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({
        message: 'Please check the enquiry details',
        errors: parsed.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    const details = parsed.data;
    const requestHash = createHash('sha256').update(JSON.stringify(details)).digest('hex');
    const suppliedKey = req.get('Idempotency-Key') || req.body?.requestId;
    if (suppliedKey && (typeof suppliedKey !== 'string' || !/^[a-z0-9-]{16,80}$/i.test(suppliedKey))) {
        return res.status(400).json({ message: 'Invalid enquiry request identifier' });
    }
    // Older forms without a key still deduplicate identical submissions that day.
    const requestId = suppliedKey || `${new Date().toISOString().slice(0, 10)}-${requestHash}`;
    try {
        let enquiry = await Enquiry.findOne({ requestId });
        if (!enquiry) {
            try {
                enquiry = await Enquiry.create({
                    requestId, requestHash, Bride: details.bride, Groom: details.groom,
                    Contact: details.contact, Date: details.eventDate, Reach: details.reach,
                    SubmittedTime: new Date().toISOString(), isViewed: false,
                });
            } catch (error) {
                if (error.code !== 11000) throw error;
                enquiry = await Enquiry.findOne({ requestId });
                if (!enquiry) throw error;
            }
        }
        if (enquiry.requestHash !== requestHash) return res.status(409).json({ message: 'This request identifier has already been used for different details' });
        // Delivery is retried independently from this durable receipt.
        return res.status(201).json({ message: 'Your enquiry has been received. Our team will be in touch.', enquiryId: enquiry._id });
    } catch (error) {
        console.error('[enquiry] persistence failed:', error.message);
        return res.status(503).json({ message: 'We could not save your enquiry. Please try again.' });
    }
}
