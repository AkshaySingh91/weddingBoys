import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    }, 
    email: {
        type: String,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\S+@\S+\.\S+$/.test(v); // Basic email validation
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    phone: {
        type: String,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\+91 ?\d{10}$/.test(v); // Basic phone validation for India
            },
            message: (props) => `${props.value} is not a valid phone number!`,
        }
    },
    password: {
        type: String,
        required: true,
    },  
    avatar: {
        type: Object,
        required: false,
        default: null,
    }
}, { timestamps: true });

export default mongoose.model('Admin', adminSchema);