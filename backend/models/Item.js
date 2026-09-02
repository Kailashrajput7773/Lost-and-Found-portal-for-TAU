const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  roll: { type: String, required: true },
  contact: { type: String, required: true },
  category: { type: String, required: true },
  desc: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: String, required: true },
  img: { type: String, default: "" },
  approved: { type: Boolean, default: false },
  type: { type: String, enum: ['lost', 'found'], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);
