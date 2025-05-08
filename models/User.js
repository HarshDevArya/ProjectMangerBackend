const mongoose = require("mongoose");

const socialSchema = new mongoose.Schema({
  github: String,
  linkedin: String,
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, maxlength: 300 },
    socials: socialSchema,
    role: { type: String, enum: ["user"], default: "user" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
