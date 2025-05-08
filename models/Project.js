const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    links: [String],
    coverUrl: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

/* ---------- virtual populate ---------- */
projectSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "project",
});

module.exports = mongoose.model("Project", projectSchema);
