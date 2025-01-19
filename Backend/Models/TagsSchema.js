import mongoose from 'mongoose'
const Tags = mongoose.Schema({
    tagType: {
        type: String, // e.g., 'Category', 'WeddingType', 'Religion'
        required: true,
        unique: true 
    },
    tags: [
        {
            type: String, // e.g., 'Beach', 'Aerial', etc.
            required: true,
            unique: true 
        },
    ],
})

export default mongoose.model('Tags', Tags);