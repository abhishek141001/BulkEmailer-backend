// models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String },
  emailBulk: { type: String},
  emailPassword: { type: String}, // For the user's email password
  provider:{type:String}
});

export default mongoose.model('User', userSchema);

