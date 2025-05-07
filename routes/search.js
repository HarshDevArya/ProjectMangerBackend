const express = require("express");
const ctrl = require("../controller/search.controller");

const router = express.Router();

router.get("/", ctrl.search); // GET /api/search?q=term&page=1

module.exports = router;
