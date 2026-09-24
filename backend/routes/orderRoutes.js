const router = require("express").Router();
const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");

router.post("/", protect, async (req,res) => {
  try {
    const { items, totalAmount, address } = req.body;
    if (!items?.length || !address) return res.status(400).json({message:"Items and address are required"});
    const order = await Order.create({ user:req.user._id, items, totalAmount, address });
    res.status(201).json(await order.populate("items.food"));
  } catch(e) { res.status(500).json({message:e.message}); }
});

router.get("/my", protect, async (req,res) => {
  try { res.json(await Order.find({user:req.user._id}).populate("items.food").sort({createdAt:-1})); }
  catch(e) { res.status(500).json({message:e.message}); }
});

router.get("/", protect, adminOnly, async (req,res) => {
  try { res.json(await Order.find().populate("user","name email").populate("items.food").sort({createdAt:-1})); }
  catch(e) { res.status(500).json({message:e.message}); }
});

router.put("/:id/status", protect, adminOnly, async (req,res) => {
  try { res.json(await Order.findByIdAndUpdate(req.params.id,{status:req.body.status},{new:true}).populate("user","name email")); }
  catch(e) { res.status(400).json({message:e.message}); }
});

module.exports = router;
