const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const StatusReport = require("../models/StatusReport");
const maintenanceService = require("../services/maintenance.service");

// GET /api/admin/reports (admin, staff)
const getAdminReports = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.waterPointId && mongoose.Types.ObjectId.isValid(req.query.waterPointId)) {
      query.waterPointId = req.query.waterPointId;
    }

    const reports = await StatusReport.find(query)
      .sort({ createdAt: -1 })
      .populate("waterPointId", "name building floor")
      .populate("userId", "name"); // Only name: NO email, NO password

    res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/staff (admin only)
const getStaffList = async (req, res, next) => {
  try {
    const staff = await User.find({ role: "staff" })
      .select("_id name email role isActive createdAt")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: staff,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/staff { name, email, password } (admin only)
const createStaff = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "staff",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/staff/:id/active { isActive } (admin only)
const setStaffActiveStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff user ID format",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean",
      });
    }

    const user = await User.findOne({ _id: id, role: "staff" });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found",
      });
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/overview (admin only)
const getOverview = async (req, res, next) => {
  try {
    const data = await maintenanceService.getAdminOverview();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminReports,
  getStaffList,
  createStaff,
  setStaffActiveStatus,
  getOverview,
};

