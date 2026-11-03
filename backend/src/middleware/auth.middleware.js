const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Requires a valid token. Sets req.user = { _id, name, email, role }
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, no token" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Not authorized, user not found or inactive" });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    res
      .status(401)
      .json({ success: false, message: "Not authorized, token invalid or expired" });
  }
};

// Use after protect: authorizeRoles("admin", "staff")
const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ success: false, message: "You do not have permission for this action" });
  }
  next();
};

module.exports = { protect, authorizeRoles };
