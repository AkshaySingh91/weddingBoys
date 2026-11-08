import { z } from 'zod';
import Enquiry from '../Models/EnquirySchema.js';
import WebsiteSettings from '../Models/WebsiteSettingSchema.js';
import { sendMail } from '../Utils/mailer.js';
import { escapeEmailHtml } from '../Utils/enquiryValidation.js';

let timer;
let busy = false;

export async function deliverNextEnquiry() {
    const now = new Date();
    const enquiry = await Enquiry.findOneAndUpdate({ $or: [
        { 'notification.status': 'Pending', 'notification.nextAttemptAt': { $lte: now } },
        { 'notification.status': 'Sending', 'notification.lockedAt': { $lt: new Date(Date.now() - 120000) } },
    ] }, { $set: { 'notification.status': 'Sending', 'notification.lockedAt': now }, $inc: { 'notification.attempts': 1 } },
    { sort: { createdAt: 1 }, new: true });
    if (!enquiry) return false;
    let sent = false;
    try {
        const settings = await WebsiteSettings.findOne().select('companyDetails.email').lean();
        const recipient = process.env.ENQUIRY_RECIPIENT || settings?.companyDetails?.email;
        if (!z.email().safeParse(recipient).success) throw new Error('Studio enquiry email is not configured');
        const e = escapeEmailHtml;
        sent = await sendMail({
            to: recipient, subject: 'New wedding enquiry — The Wedding Vachan',
            html: `<h1>New wedding enquiry</h1><p>Bride: ${e(enquiry.Bride)}</p><p>Groom: ${e(enquiry.Groom)}</p><p>Contact: ${e(enquiry.Contact)}</p><p>Dates: ${e(enquiry.Date.start)} – ${e(enquiry.Date.end)}</p><p>Referral: ${e(enquiry.Reach || 'Not specified')}</p>`,
            text: `Bride: ${enquiry.Bride}\nGroom: ${enquiry.Groom}\nContact: ${enquiry.Contact}\nDates: ${enquiry.Date.start} - ${enquiry.Date.end}\nReferral: ${enquiry.Reach || 'Not specified'}`,
        });
    } catch (error) {
        console.warn('[enquiry] notification delayed:', error.message);
    }
    await Enquiry.updateOne({ _id: enquiry._id, 'notification.lockedAt': now }, { $set: {
        'notification.status': sent ? 'Sent' : 'Pending',
        'notification.lockedAt': null,
        'notification.nextAttemptAt': new Date(Date.now() + Math.min(3600000, 30000 * 2 ** Math.min(enquiry.notification.attempts, 7))),
        ...(sent ? { 'notification.sentAt': new Date() } : {}),
    } });
    return true;
}

export function startEnquiryNotifications() {
    if (timer) return;
    const tick = async () => {
        if (busy) return;
        busy = true;
        try {
            for (let n = 0; n < 10; n++) {
                if (!await deliverNextEnquiry()) break;
            }
        }
        catch (error) { console.error('[enquiry] delivery worker:', error.message); }
        finally { busy = false; }
    };
    timer = setInterval(tick, 15000);
    timer.unref();
}
