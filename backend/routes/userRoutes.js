const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/profile", protect, async (req,res) => res.json(req.user));

router.put("/profile", protect, async (req,res) => {
  try {
    const updates = { name:req.body.name, phone:req.body.phone, address:req.body.address };
    if (req.body.password) updates.password = await bcrypt.hash(req.body.password,10);
    const user = await User.findByIdAndUpdate(req.user._id, updates, {new:true}).select("-password");
    res.json(user);
  } catch(e) { res.status(400).json({message:e.message}); }
});

router.get("/", protect, adminOnly, async (req,res) => {
  res.json(await User.find().select("-password").sort({createdAt:-1}));
});

module.exports = router;
