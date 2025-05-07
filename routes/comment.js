const express = require("express");
const { requireAuth, requireOwnerOrAdmin } = require("../middleware/auth");
const Comment = require("../models/Comment");
const ctrl = require("../controller/comment.controller");

const router = express.Router({ mergeParams: true }); // inherits :projectId param

router.post("/", requireAuth, ctrl.create); // POST /api/projects/:projectId/comments
router.delete(
  "/:commentId",
  requireAuth,
  requireOwnerOrAdmin(Comment),
  ctrl.remove
);

module.exports = router;
