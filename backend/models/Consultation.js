// backend/models/Consultation.js
const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }, // Updated from message to address
  status: { type: String, default: "New" }, // New, Contacted, Closed
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Consultation", consultationSchema);
