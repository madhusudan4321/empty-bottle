const dns = require("dns");
const mongoose = require("mongoose");

// Use Google Public DNS so mongodb+srv:// SRV lookups work on
// networks (e.g. campus Wi-Fi) whose default resolver blocks them.
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
