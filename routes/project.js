const express = require("express");
const { upload } = require("../middleware/upload");
const { requireAuth, requireOwnerOrAdmin } = require("../middleware/auth");
const Project = require("../models/Project");
const ctrl = require("../controller/project.controller");

const router = express.Router();

router.get("/", ctrl.list); // GET /api/projects
router.post("/", requireAuth, upload.single("cover"), ctrl.create);

router
  .route("/:id")
  .get(ctrl.getOne)
  .put(requireAuth, requireOwnerOrAdmin(Project), ctrl.update)
  .delete(requireAuth, requireOwnerOrAdmin(Project), ctrl.remove);

module.exports = router;
