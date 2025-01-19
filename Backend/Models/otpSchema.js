import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    target: { type: String, required: true }, // demo@abc or 13123123
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

export default mongoose.model("Otp", otpSchema);
