const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    food: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  address: { type: String, required: true },
  status: {
    type: String,
    enum: ["Placed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
    default: "Placed"
  }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
