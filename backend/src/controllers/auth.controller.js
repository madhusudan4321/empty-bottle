const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register  (always creates a student)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Email is already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "student",
    });

    res.status(201).json({
      success: true,
      data: { token: generateToken(user._id), user: formatUser(user) },
    });
  } catch (error) {
    console.error("Register error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    const valid = user && (await bcrypt.compare(password, user.password));

    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res
        .status(403)
        .json({ success: false, message: "This account is deactivated" });
    }

    res.json({
      success: true,
      data: { token: generateToken(user._id), user: formatUser(user) },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/auth/logout  (JWT is stateless; the client deletes the token)
const logout = (req, res) => {
  res.json({ success: true, data: { message: "Logged out" } });
};

// GET /api/auth/me  (returns the logged-in user; used by the frontend on page load)
const getMe = (req, res) => {
  res.json({ success: true, data: { user: req.user } });
};

module.exports = { register, login, logout, getMe };
