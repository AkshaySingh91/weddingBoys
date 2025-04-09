import mongoose from 'mongoose';

const btsRoleSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  key: { 
    type: String, 
    required: true, 
    unique: true 
  }
}, { timestamps: true }); 
 
const BtsRole = mongoose.model('BtsRole', btsRoleSchema);

export default BtsRole;