require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Usage: npm run create-admin -- "Admin Name" admin@example.com password123
// Add a third role argument to create staff: ... password123 staff
const [name, email, password, role = "admin"] = process.argv.slice(2);

const run = async () => {
  if (!name || !email || !password) {
    console.log('Usage: npm run create-admin -- "Name" email password [admin|staff]');
    return;
  }
  if (!["admin", "staff"].includes(role)) {
    console.log("Role must be admin or staff");
    return;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      console.log("A user with this email already exists");
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed, role });
    console.log(`Created ${role}: ${email}`);
  } catch (error) {
    console.error("Failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
