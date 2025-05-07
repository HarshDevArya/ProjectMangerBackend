const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* -------------------------------------------------
   Require a valid JWT (stored in http‑only cookie)
--------------------------------------------------*/
const requireAuth = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(payload.id).select("-passwordHash");
    if (!req.user) throw new Error("User not found");
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* -------------------------------------------------
   Ensure current user owns the resource OR is admin
   – injects the doc onto req.doc for downstream use
--------------------------------------------------*/
const requireOwnerOrAdmin = (Model) => async (req, res, next) => {
  const id =
    req.params.id || req.params.commentId || req.params.projectId || null;
  const doc = await Model.findById(id);
  if (!doc) return res.status(404).json({ message: "Not found" });

  const isOwner = doc.author?.toString() === req.user.id;
  const isAdmin = req.user.role === "admin";

  if (isOwner || isAdmin) {
    req.doc = doc;
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
};

module.exports = { requireAuth, requireOwnerOrAdmin };
