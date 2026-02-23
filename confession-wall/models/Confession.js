const mongoose = require('mongoose');

const ReactionSchema = new mongoose.Schema({
  like: { type: Number, default: 0 },
  love: { type: Number, default: 0 },
  laugh: { type: Number, default: 0 }
}, { _id: false });

const ConfessionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  secretCodeHash: { type: String, required: true },
  reactions: { type: ReactionSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  userId: { type: String, required: true }
});

module.exports = mongoose.model('Confession', ConfessionSchema);
