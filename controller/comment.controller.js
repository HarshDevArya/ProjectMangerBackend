const Comment = require("../models/Comment");

/* ---------- create comment ---------- */
exports.create = async (req, res) => {
  const comment = await Comment.create({
    content: req.body.content,
    author: req.user.id,
    project: req.params.projectId,
  });
  res.status(201).json(comment);
};

/* ---------- delete comment ---------- */
exports.remove = async (req, res) => {
  await req.doc.deleteOne(); // req.doc injected by requireOwnerOrAdmin
  res.json({ message: "Comment deleted" });
};
