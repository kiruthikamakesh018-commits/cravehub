require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOne({
      email: "kiruthikamakesh018@gmail.com"
    });

    if (!user) {
      console.log("Admin user not found");
      process.exit();
    }

    user.password = await bcrypt.hash("Kmakesh@018", 10);
    user.role = "admin";

    await user.save();

    console.log("Admin password reset successfully");
    console.log("Email:kiruthikamakesh018@gmail.com ");
    console.log("Password:Kmakesh@018 ");

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

resetAdmin();