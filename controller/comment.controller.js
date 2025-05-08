const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Project = require("../models/Project");

/* ---------- create comment ---------- */
/* ---------- create comment ---------- */
exports.create = async (req, res) => {
  try {
    const { content = "" } = req.body;
    const { projectId } = req.params;

    if (content.trim().length < 1) {
      return res.status(400).json({ message: "Comment content is required." });
    }

    // (ObjectId + project exists checks omitted for brevity)

    // create
    let comment = await Comment.create({
      content: content.trim(),
      author: req.user.id,
      project: projectId,
    });

    // populate author name so the frontend has it immediately
    comment = await comment.populate("author", "name");

    res.status(201).json(comment);
  } catch (err) {
    console.error("Comment create error:", err);
    res.status(500).json({ message: "Server error while adding comment." });
  }
};

/* ---------- delete comment ---------- */
exports.remove = async (req, res) => {
  try {
    if (!req.doc) {
      return res.status(404).json({ message: "Comment not found." });
    }
    await req.doc.deleteOne(); // injected by requireOwnerOrAdmin
    res.json({ message: "Comment deleted." });
  } catch (err) {
    console.error("Comment delete error:", err);
    res.status(500).json({ message: "Server error while deleting comment." });
  }
};
