const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const makeToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// =========================
// REGISTER
// =========================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      token: makeToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// LOGIN
// =========================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      token: makeToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

// =========================
// SEED / RESET ADMIN
// =========================
router.post("/seed-admin", async (req, res) => {
  try {
    const {
      name = "Admin",
      email = "admin@example.com",
      password = "Admin@123",
    } = req.body || {};

    const normalizedEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      email: normalizedEmail,
    });

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    if (user) {
      // IMPORTANT:
      // Reset password AND role for existing user
      user.name = name;
      user.password = hashedPassword;
      user.role = "admin";

      await user.save();
    } else {
      // Create new admin
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "admin",
      });
    }

    res.json({
      message: "Admin ready",
      email: normalizedEmail,
      password,
    });
  } catch (error) {
    console.error("Seed admin error:", error);

    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;