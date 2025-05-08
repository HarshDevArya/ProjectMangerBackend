const mongoose = require("mongoose");
const User = require("../models/User");

const urlRegex =
  /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[/\w\-._~:/?#[\]@!$&'()*+,;=.]*$/i;

/* ---------- public profile ---------- */
exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID." });

    const user = await User.findById(id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found." });

    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Server error while fetching profile." });
  }
};

/* ---------- update profile ---------- */
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;

    /* ownership check */
    if (req.user.id !== id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden." });

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID." });

    /* ---- validate fields ---- */
    const up = {};
    const { name, bio, socials } = req.body;

    if (name !== undefined) {
      if (name.trim().length < 2)
        return res
          .status(400)
          .json({ message: "Name must be at least 2 characters." });
      up.name = name.trim();
    }

    if (bio !== undefined) {
      if (bio.length > 300)
        return res
          .status(400)
          .json({ message: "Bio must be 300 characters or fewer." });
      up.bio = bio;
    }

    if (socials) {
      const setSocials = {};
      if (socials.github !== undefined) {
        if (socials.github && !urlRegex.test(socials.github))
          return res.status(400).json({ message: "Invalid GitHub URL." });
        setSocials["socials.github"] = socials.github;
      }
      if (socials.linkedin !== undefined) {
        if (socials.linkedin && !urlRegex.test(socials.linkedin))
          return res.status(400).json({ message: "Invalid LinkedIn URL." });
        setSocials["socials.linkedin"] = socials.linkedin;
      }
      Object.assign(up, setSocials);
    }

    if (Object.keys(up).length === 0)
      return res.status(400).json({ message: "Nothing to update." });

    /* ---- update ---- */
    const updated = await User.findByIdAndUpdate(id, up, {
      new: true,
    }).select("-passwordHash");

    res.json(updated);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error while updating profile." });
  }
};

/* ---------- delete profile ---------- */
exports.deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.user.role !== "admin")
      return res.status(403).json({ message: "Forbidden." });

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid user ID." });

    await User.findByIdAndDelete(id);
    res.json({ message: "Profile deleted." });
  } catch (err) {
    console.error("Delete profile error:", err);
    res.status(500).json({ message: "Server error while deleting profile." });
  }
};
