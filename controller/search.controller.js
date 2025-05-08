// controllers/search.controller.js
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");

exports.search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 2;

    const regex = new RegExp(q, "i");

    /* ---------- find matching users ---------- */
    const users = await User.find({ name: regex })
      .select("name socials")
      .limit(20); // return up to 20 profiles

    const userIds = users.map((u) => u._id);

    /* ---------- build project filter ---------- */
    const projectFilter = {
      $or: [
        { title: regex },
        { description: regex },
        ...(userIds.length ? [{ author: { $in: userIds } }] : []),
      ],
    };

    /* ---------- query + count ---------- */
    const [projects, count] = await Promise.all([
      Project.find(projectFilter)
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(projectFilter),
    ]);

    res.json({
      users,
      projects,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Server error while searching." });
  }
};
