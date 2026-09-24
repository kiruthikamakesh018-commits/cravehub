const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, default: "https://placehold.co/600x400?text=Food" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Food", foodSchema);
