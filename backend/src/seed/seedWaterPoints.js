require("dotenv").config();
const mongoose = require("mongoose");
const WaterPoint = require("../models/WaterPoint");

// TODO: replace these placeholder names and coordinates with real campus locations
const waterPoints = [
  { name: "Sports Complex", latitude: 28.6139, longitude: 77.2090, capacity: 15, crowdRadius: 40 },
  { name: "Academic Block", latitude: 28.6145, longitude: 77.2100, capacity: 10, crowdRadius: 30 },
  { name: "Library", latitude: 28.6150, longitude: 77.2085, capacity: 8, crowdRadius: 30 },
  { name: "Hostel Gate", latitude: 28.6130, longitude: 77.2110, capacity: 12, crowdRadius: 35 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await WaterPoint.deleteMany({});
    const created = await WaterPoint.insertMany(waterPoints);
    console.log(`Seeded ${created.length} water points`);
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();
