const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const makeToken = user => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
    if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });

    const user = await User.create({
      name, email, password: await bcrypt.hash(password, 10)
    });
    res.status(201).json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: "Invalid email or password" });
    res.json({ token: makeToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role }});
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/seed-admin", async (req, res) => {
  try {
    const { name="Admin", email="admin@example.com", password="Admin@123" } = req.body || {};
    let user = await User.findOne({ email });
    if (user) {
      user.role = "admin";
      await user.save();
    } else {
      user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: "admin" });
    }
    res.json({ message: "Admin ready", email, password });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
