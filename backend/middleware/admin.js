const router = require('express').Router();
const User = require('../models/User');
const adminMiddleware = require('../middleware/admin');

// 🛡️ Get All Users for Admin Dashboard
router.get('/all-users', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Don't send passwords!
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "Server Error fetching users" });
  }
});

module.exports = router;