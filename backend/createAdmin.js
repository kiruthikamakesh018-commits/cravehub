require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await User.findOne({
      email: "admin@foodie.com",
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash(
      "Admin@123",
      10
    );

    const admin = new User({
      name: "Foodie Admin",
      email: "admin@foodie.com",
      password: hashedPassword,
      role: "admin",
    });

    await admin.save();

    console.log("Admin created successfully!");
    console.log("Email: admin@foodie.com");
    console.log("Password: Admin@123");

    process.exit();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createAdmin();