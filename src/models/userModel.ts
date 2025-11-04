import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String },
  isAdmin: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);
