const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
/* -------------- helpers -------------- */
const signToken = (res, payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    // secure: process.env.NODE_ENV === "production",
    // domain: process.env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/* ------------------------- handlers ------------------------- */

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.signup = async (req, res) => {
  try {
    /* ---------- validate input ---------- */
    const { name = "", email = "", password = "" } = req.body;

    if (name.trim().length < 2)
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters." });

    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email address." });

    if (password.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });

    /* ---------- enforce uniqueness ---------- */
    if (await User.exists({ email: email.toLowerCase() }))
      return res.status(409).json({ message: "Email already in use." });

    /* ---------- create user ---------- */
    const passwordHash = await argon2.hash(password);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      passwordHash,
    });

    /* ---------- auth cookie ---------- */
    signToken(res, { id: user.id });

    /* ---------- success ---------- */
    res
      .status(201)
      .json({ user: user.toObject({ getters: true, virtuals: false }) });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup." });
  }
};
// Login
exports.login = async (req, res) => {
  try {
    /* ---------- basic validation ---------- */
    const { email = "", password = "" } = req.body;

    if (!email.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    /* ---------- lookup user ---------- */
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    /* ---------- verify password ---------- */
    const valid = await argon2.verify(user.passwordHash, password);

    if (!valid) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    /* ---------- success ---------- */
    signToken(res, { id: user.id });
    res.json({ user: user.toObject({ getters: true, virtuals: false }) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

exports.logout = (_, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    // domain: process.env.COOKIE_DOMAIN,
  });
  res.json({ message: "Logged out" });
};

/* optional: current user */
exports.me = (req, res) => res.json({ user: req.user });
