const router = require("express").Router();
const Food = require("../models/Food");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", async (req,res) => {
  try {
    const { search="", category="" } = req.query;
    const q = {};
    if (search) q.name = { $regex: search, $options: "i" };
    if (category && category !== "All") q.category = category;
    res.json(await Food.find(q).sort({ createdAt: -1 }));
  } catch(e) { res.status(500).json({message:e.message}); }
});

router.post("/", protect, adminOnly, async (req,res) => {
  try { res.status(201).json(await Food.create(req.body)); }
  catch(e) { res.status(400).json({message:e.message}); }
});

router.put("/:id", protect, adminOnly, async (req,res) => {
  try { res.json(await Food.findByIdAndUpdate(req.params.id, req.body, {new:true})); }
  catch(e) { res.status(400).json({message:e.message}); }
});

router.delete("/:id", protect, adminOnly, async (req,res) => {
  try { await Food.findByIdAndDelete(req.params.id); res.json({message:"Food deleted"}); }
  catch(e) { res.status(400).json({message:e.message}); }
});

module.exports = router;
