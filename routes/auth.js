const express = require("express");
const ctrl = require("../controller/auth.controller");
const { requireAuth, requireOwnerOrAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", ctrl.signup);
router.post("/login", ctrl.login);
router.post("/logout", ctrl.logout);
router.get("/me", requireAuth, ctrl.me); // current‑user helper (optional)

module.exports = router;
