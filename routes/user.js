const express = require("express");
const ctrl = require("../controller/user.controller");
const { requireAuth, requireOwnerOrAdmin } = require("../middleware/auth");

const router = express.Router();

// public profile
router.get("/:id", ctrl.getProfile);

// update / delete own profile
router
  .route("/:id")
  .put(requireAuth, ctrl.updateProfile) // only owner can update (checked inside controller)
  .delete(requireAuth, ctrl.deleteProfile);

module.exports = router;
