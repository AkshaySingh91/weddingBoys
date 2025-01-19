import mongoose from 'mongoose'

const inviteCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null, // Default to null for the initial invite code
    },
    expiresAt: {
        type: Date,
        required: true,
    },
})

export default mongoose.model("InviteCode", inviteCodeSchema);
