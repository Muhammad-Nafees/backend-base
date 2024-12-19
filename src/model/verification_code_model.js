import mongoose, { model } from "mongoose";

const VerificationCodeSchema = new mongoose.Schema({
    verification_code: {
        type: String,
        required: true
    }
});


export const VerificationCodeModal = model("VerificationCodeSchema", VerificationCodeSchema);