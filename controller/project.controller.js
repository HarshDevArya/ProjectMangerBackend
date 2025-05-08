const { put, del: deleteBlob } = require("@vercel/blob");
const Project = require("../models/Project");
const Comment = require("../models/Comment");
const mongoose = require("mongoose");

/* ---------- list with pagination ---------- */
exports.list = async (req, res) => {
  try {
    console.log("limit", req.query.limit);
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 3;

    /* ---------- build filter ---------- */
    const filter = {};

    if (req.query.author && mongoose.Types.ObjectId.isValid(req.query.author)) {
      filter.author = req.query.author;
    }

    /* (optional) simple full-text search
       /api/projects?search=react
    */
    if (req.query.search) {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ title: regex }, { description: regex }];
    }

    /* ---------- query ---------- */
    const [projects, count] = await Promise.all([
      Project.find(filter)
        .populate("author", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Project.countDocuments(filter),
    ]);

    res.json({ projects, totalPages: Math.ceil(count / limit) });
  } catch (err) {
    console.error("Project list error:", err);
    res.status(500).json({ message: "Server error while listing projects." });
  }
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

    if (linkArr.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one project URL is required." });
    }

    for (const l of linkArr) {
      if (!urlRegex.test(l)) {
        return res.status(400).json({ message: `Invalid URL: ${l}` });
      }
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
  try {
    const { id } = req.params;

    /* ---------- validate ObjectId ---------- */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    /* ---------- fetch & populate ---------- */
    const project = await Project.findById(id)
      .populate("author", "name socials")
      .populate({
        path: "comments",
        populate: { path: "author", select: "name" },
      })
      .lean();

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    /* ---------- success ---------- */
    res.json(project);
  } catch (err) {
    console.error("Error fetching project:", err);
    res.status(500).json({ message: "Server error while fetching project." });
  }
};

/* ---------- update ---------- */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    /* ---------- validate ID ---------- */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid project ID." });
    }

    /*requireOwnerOrAdmin middleware */
    const project = req.doc;

    /* ---------- validate body ---------- */
    const {
      title = project.title,
      description = project.description,
      links = "",
    } = req.body;

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

    if (linkArr.length === 0)
      return res
        .status(400)
        .json({ message: "At least one project URL is required." });

    const invalid = linkArr.find((l) => !urlRegex.test(l));
    if (invalid)
      return res.status(400).json({ message: `Invalid URL: ${invalid}` });

    /* ---------- apply updates & save ---------- */
    project.title = title.trim();
    project.description = description.trim();
    project.links = linkArr;

    await project.save();

    res.json(project);
  } catch (err) {
    console.error("Project update error:", err);
    res.status(500).json({ message: "Server error while updating project." });
  }
};

/* ---------- delete ---------- */

exports.remove = async (req, res) => {
  try {
    /* ---------- safety check ---------- */
    const project = req.doc; // injected by requireOwnerOrAdmin
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    /* ---------- delete cover image if any ---------- */
    if (project.coverUrl) {
      // convert https://blob.vercel-storage.com/xyz/covers/123.png
      //        to covers/123.png
      const parts = project.coverUrl.split("/covers/");
      if (parts.length === 2) {
        const key = `covers/${parts[1]}`;
        try {
          await deleteBlob(key, {
            token: process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
          });
        } catch (blobErr) {
          console.error("Failed to delete blob:", key, blobErr);
        }
      }
    }

    /* ---------- cascade delete comments ---------- */
    await Comment.deleteMany({ project: project._id });

    /* ---------- delete project ---------- */
    await project.deleteOne();

    res.json({ message: "Project removed." });
  } catch (err) {
    console.error("Project delete error:", err);
    res.status(500).json({ message: "Server error while deleting project." });
  }
};
