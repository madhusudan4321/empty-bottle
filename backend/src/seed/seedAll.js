require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const WaterPoint = require("../models/WaterPoint");
const StatusReport = require("../models/StatusReport");
const MaintenanceRequest = require("../models/MaintenanceRequest");
const Presence = require("../models/Presence");

// TODO: replace with real campus coordinates
const waterPointData = [
  { name: "Sports Complex", latitude: 28.6139, longitude: 77.2090, capacity: 15, crowdRadius: 40 },
  { name: "Academic Block", latitude: 28.6145, longitude: 77.2100, capacity: 10, crowdRadius: 30 },
  { name: "Library", latitude: 28.6150, longitude: 77.2085, capacity: 8, crowdRadius: 30 },
  { name: "Hostel Gate", latitude: 28.6130, longitude: 77.2110, capacity: 12, crowdRadius: 35 },
  { name: "Cafeteria", latitude: 28.6142, longitude: 77.2078, capacity: 12, crowdRadius: 35 },
];

const userData = [
  { name: "Admin User", email: "admin@example.com", password: "admin123", role: "admin" },
  { name: "Staff One", email: "staff1@example.com", password: "staff123", role: "staff" },
  { name: "Staff Two", email: "staff2@example.com", password: "staff123", role: "staff" },
  { name: "Student One", email: "student1@example.com", password: "student123", role: "student" },
  { name: "Student Two", email: "student2@example.com", password: "student123", role: "student" },
];

const seed = async () => {
  if (process.env.NODE_ENV === "production") {
    console.log("Refusing to seed in production");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Promise.all([
      User.deleteMany({}),
      WaterPoint.deleteMany({}),
      StatusReport.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Presence.deleteMany({}),
    ]);

    const users = await User.insertMany(
      await Promise.all(
        userData.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 10) }))
      )
    );
    const wps = await WaterPoint.insertMany(waterPointData);
    const [s1, s2] = users.filter((u) => u.role === "student");
    const [sports, academic, library, hostel] = wps;

    await StatusReport.insertMany([
      // 2 different students, same water point + issue -> distinct count = 2
      { waterPointId: sports._id, userId: s1._id, issueType: "water_unavailable", description: "No water coming out" },
      { waterPointId: sports._id, userId: s2._id, issueType: "water_unavailable", description: "Tap is dry" },
      // same student twice -> still counts as 1 distinct reporter
      { waterPointId: academic._id, userId: s1._id, issueType: "water_warm", description: "Water is warm" },
      { waterPointId: academic._id, userId: s1._id, issueType: "water_warm", description: "Still warm" },
      // single reports
      { waterPointId: library._id, userId: s2._id, issueType: "dirty", description: "Area is dirty" },
      { waterPointId: hostel._id, userId: s2._id, issueType: "leakage", description: "Pipe leaking" },
    ]);

    console.log(`Seeded ${users.length} users, ${wps.length} water points, 6 reports`);
    console.log("Logins: admin@example.com/admin123, staff1@example.com/staff123,");
    console.log("        staff2@example.com/staff123, student1@example.com/student123,");
    console.log("        student2@example.com/student123");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
