import { z } from 'zod';
import Enquiry from '../Models/EnquirySchema.js';
import WebsiteSettings from '../Models/WebsiteSettingSchema.js';
import { sendMail } from '../Utils/mailer.js';
import { escapeEmailHtml } from '../Utils/enquiryValidation.js';

/** The studio's email for one enquiry: only the details they gave, escaped. */
export function enquiryMail(enquiry) {
    const e = escapeEmailHtml;
    const names = [enquiry.Bride, enquiry.Groom].filter(Boolean).join(' & ');
    const d = enquiry.Date;
    const when = d?.start ? (d.end && d.end !== d.start ? `${d.start} – ${d.end}` : d.start) : (enquiry.DateNote || 'Not given');
    const rows = [
        ['Names', names], ['Reply to', enquiry.Contact], ['For', enquiry.Kind], ['When', when], ['Where', enquiry.City],
        ['Came from', enquiry.Source], ['Was looking at', enquiry.Context], ['Message', enquiry.Message],
        ['Sent by', enquiry.Channel === 'whatsapp' ? 'WhatsApp (they opened a chat too)' : 'The website form'], ['Found us via', enquiry.Reach],
    ].filter(([, v]) => v);
    return {
        subject: `New wedding enquiry: ${names}${enquiry.Kind ? `, ${enquiry.Kind}` : ''} — The Wedding Vachan`,
        html: `<h1>New wedding enquiry</h1>${rows.map(([k, v]) => `<p><strong>${e(k)}:</strong> ${e(v)}</p>`).join('')}`,
        text: rows.map(([k, v]) => `${k}: ${v}`).join('\n'),
    };
}

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
        sent = await sendMail({ to: recipient, ...enquiryMail(enquiry) });
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
