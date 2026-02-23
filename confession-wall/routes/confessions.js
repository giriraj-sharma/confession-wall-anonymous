const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const bcrypt = require('bcrypt');
const { isAuthenticated } = require('../middleware/auth');

// Create (protected)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { text, secretCode } = req.body;
    if (!text || !secretCode) return res.status(400).json({ error: 'Text and secretCode required' });
    if (secretCode.length < 4) return res.status(400).json({ error: 'Secret code must be at least 4 characters' });
    const hash = await bcrypt.hash(secretCode, 10);
    const conf = new Confession({ text, secretCodeHash: hash, userId: req.user.id });
    await conf.save();
    res.json({ success: true, confession: conf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    const confs = await Confession.find(filter).sort({ createdAt: -1 }).lean();
    // do not send secretCodeHash to clients
    const safe = confs.map(c => ({
      _id: c._id,
      text: c.text,
      reactions: c.reactions,
      createdAt: c.createdAt,
      userId: c.userId
    }));
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update with secret code (protected)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const { secretCode, text } = req.body;
    if (!secretCode) return res.status(400).json({ error: 'Secret code required' });
    if (secretCode.length < 4) return res.status(400).json({ error: 'Secret code must be at least 4 characters' });
    const conf = await Confession.findById(req.params.id);
    if (!conf) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(secretCode, conf.secretCodeHash);
    if (!ok) return res.status(403).json({ error: 'Wrong secret code' });
    if (text) conf.text = text;
    await conf.save();
    res.json({ success: true, confession: conf });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete with secret code
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const { secretCode } = req.body;
    if (!secretCode) return res.status(400).json({ error: 'Secret code required' });
    const conf = await Confession.findById(req.params.id);
    if (!conf) return res.status(404).json({ error: 'Not found' });
    const ok = await bcrypt.compare(secretCode, conf.secretCodeHash);
    if (!ok) return res.status(403).json({ error: 'Wrong secret code' });
    await conf.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add reaction
router.post('/:id/react', async (req, res) => {
  try {
    const { type } = req.body; // 'like' | 'love' | 'laugh'
    if (!['like', 'love', 'laugh'].includes(type)) return res.status(400).json({ error: 'Invalid reaction type' });
    const conf = await Confession.findById(req.params.id);
    if (!conf) return res.status(404).json({ error: 'Not found' });
    conf.reactions[type] = (conf.reactions[type] || 0) + 1;
    await conf.save();
    res.json({ success: true, reactions: conf.reactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
