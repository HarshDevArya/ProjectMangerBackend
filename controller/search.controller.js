const User = require("../models/User");
const Project = require("../models/Project");

exports.search = async (req, res) => {
  const q = (req.query.q || "").trim();
  const page = +req.query.page || 1;
  const limit = 6;

  const regex = new RegExp(q, "i");

  const [users, projects] = await Promise.all([
    User.find({ name: regex }).select("name socials").limit(5),
    Project.find({ $or: [{ title: regex }, { description: regex }] })
      .populate("author", "name")
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  res.json({ users, projects });
};
