import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String }, // Display name
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImageUrl: { type: String },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
});

const User = mongoose.model("User", userSchema);
export default User;
