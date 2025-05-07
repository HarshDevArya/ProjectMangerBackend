const { put, del: deleteBlob } = require("@vercel/blob");
const Project = require("../models/Project");

/* ---------- list with pagination ---------- */
exports.list = async (req, res) => {
  const page = +req.query.page || 1;
  const limit = 6;

  const [projects, count] = await Promise.all([
    Project.find()
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Project.countDocuments(),
  ]);

  res.json({ projects, totalPages: Math.ceil(count / limit) });
};

/* ---------- create ---------- */
const urlRegex =
  /^(https?:\/\/)[\w.-]+(?:\.[\w.-]+)+[/\w\-._~:/?#[\]@!$&'()*+,;=.]*$/i;
const isImageMime = (type) => /^image\/(png|jpe?g|webp|gif)$/i.test(type);

exports.create = async (req, res) => {
  try {
    /* ---------- validate body ---------- */
    const { title = "", description = "", links = "" } = req.body;

    if (title.trim().length < 3)
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters." });

    if (description.trim().length < 10)
      return res
        .status(400)
        .json({ message: "Description must be at least 10 characters." });

    const linkArr = links
      ? links
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    for (const l of linkArr) {
      if (!urlRegex.test(l))
        return res.status(400).json({ message: `Invalid URL: ${l}` });
    }

    /* ---------- optional cover upload ---------- */
    let coverUrl = "";
    let uploadedKey = ""; // track for cleanup
    if (req.file) {
      if (!isImageMime(req.file.mimetype)) {
        return res
          .status(400)
          .json({ message: "Cover must be an image file." });
      }

      try {
        const key = `covers/${Date.now()}-${req.file.originalname}`;
        const { url } = await put(key, req.file.buffer, {
          access: "public",
          token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
        });
        coverUrl = url;
        uploadedKey = key;
      } catch (uploadErr) {
        console.error("Blob upload failed:", uploadErr);
        return res
          .status(500)
          .json({ message: "Failed to upload cover image." });
      }
    }

    /* ---------- create project ---------- */
    let project;
    try {
      project = await Project.create({
        title: title.trim(),
        description: description.trim(),
        links: linkArr,
        coverUrl,
        author: req.user.id,
      });
    } catch (dbErr) {
      // Cleanup orphaned blob if DB insert failed
      if (uploadedKey) {
        try {
          await deleteBlob(uploadedKey, {
            token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
          });
        } catch (cleanupErr) {
          console.error("Cleanup failed for blob:", uploadedKey, cleanupErr);
        }
      }
      throw dbErr;
    }

    /* ---------- success ---------- */
    res.status(201).json(project);
  } catch (err) {
    console.error("Project create error:", err);
    res.status(500).json({ message: "Server error while creating project." });
  }
};

/* ---------- read single ---------- */
exports.getOne = async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate("author", "name socials")
    .populate({
      path: "comments",
      populate: { path: "author", select: "name" },
    });

  if (!project) return res.status(404).json({ message: "Not found" });
  res.json(project);
};

/* ---------- update ---------- */
exports.update = async (req, res) => {
  const p = req.doc; // injected by middleware
  const { title, description, links } = req.body;

  p.title = title ?? p.title;
  p.description = description ?? p.description;
  p.links = links?.split(",").map((s) => s.trim()) ?? p.links;

  await p.save();
  res.json(p);
};

/* ---------- delete ---------- */
exports.remove = async (req, res) => {
  await req.doc.deleteOne();
  res.json({ message: "Project removed" });
};
