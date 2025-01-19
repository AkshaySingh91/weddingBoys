import { nanoid } from "nanoid";
import inviteCodeSchema from '../Models/inviteCodeSchema.js'

export async function generateInviteCode(adminId = null, d = 7) {
    try {
        const code = nanoid(10);
        const expiresAt = new Date(Date.now() + d * 24 * 60 * 60 * 1000); // Expires in 7 days

        console.log(await inviteCodeSchema.find())
        const prevCode = await inviteCodeSchema.deleteMany({})
        console.log(await inviteCodeSchema.find())
        const newCode = new inviteCodeSchema({
            code,
            createdBy: adminId, // Null for developer, adminId for new codes
            expiresAt,
        });
        await newCode.save();
        console.log("Invite Code Generated:", code);
        return newCode;
    } catch (error) {
        console.error("Error generating invite code:", error.message);
        throw error;
    }
};
export async function checkInviteCode(code) {
    const orignalCode = await inviteCodeSchema.findOne({ code });
    if (!orignalCode) {
        throw new Error('Invalid Code');
    } else {
        if (orignalCode.expiresAt < Date.now()) {
            throw new Error('Code has Expires ');
        } else {
            return true;
        }
    }
}