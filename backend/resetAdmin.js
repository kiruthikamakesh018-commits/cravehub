require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({
      email: "admin@foodie.com"
    });

    if (!user) {
      console.log("Admin user not found");
      process.exit();
    }

    user.password = await bcrypt.hash("Admin@123", 10);
    user.role = "admin";

    await user.save();

    console.log("Admin password reset successfully");
    console.log("Email: admin@foodie.com");
    console.log("Password: Admin@123");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

resetAdmin();