const User = require("../models/User");

/* ---------- public profile ---------- */
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user);
};

/* ---------- update / delete ---------- */
exports.updateProfile = async (req, res) => {
  if (req.user.id !== req.params.id)
    return res.status(403).json({ message: "Forbidden" });

  const { name, bio, socials } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { name, bio, socials },
    { new: true }
  ).select("-passwordHash");
  res.json(updated);
};

exports.deleteProfile = async (req, res) => {
  if (req.user.id !== req.params.id)
    return res.status(403).json({ message: "Forbidden" });

  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "Profile deleted" });
};
