import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema({
    imageMetaData: {
        type: Object, required: true
    },
    isHero: {
        type: Boolean, default: false
    },
    about: {
        type: Object,
        default: null
    }
})

export default mongoose.model("TeamSchema", TeamSchema)
