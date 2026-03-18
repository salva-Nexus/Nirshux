// backend/routes/chat.js
const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

const alertAdmin = async (userName, userEmail, messageText) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: 'nirshuxcom@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
    });
    await transporter.sendMail({
      from: '"Nirshux System" <nirshuxcom@gmail.com>',
      to: 'nirshuxcom@gmail.com',
      subject: `💬 New Chat from ${userName}`,
      html: `
        <div style="font-family: monospace; background: #0A0A0A; color: #fff; padding: 40px;">
          <h1 style="color: #00F2C3; font-weight: 900;">NIRSHUX CHAT ALERT</h1>
          <div style="background: #1a1a1a; border: 2px solid #00F2C3; border-radius: 16px; padding: 30px; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-transform: uppercase;">FROM:</p>
            <h2 style="color: #00F2C3;">${userName}</h2>
            <p style="color: #666;">${userEmail}</p>
            <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-top: 20px;">MESSAGE:</p>
            <p style="color: #fff; background: #0A0A0A; padding: 15px; border-radius: 8px;">${messageText}</p>
          </div>
          <p style="color: #666; font-size: 11px; text-align: center;">Login to your admin dashboard to respond.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('❌ Admin email alert failed:', err.message);
  }
};

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, recipientId } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ msg: 'MESSAGE_EMPTY' });

    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ msg: 'USER_NOT_FOUND' });

    let targetUserId;
    let senderType;

    if (sender.role === 'admin') {
      if (!recipientId) return res.status(400).json({ msg: 'RECIPIENT_REQUIRED_FOR_ADMIN' });
      targetUserId = recipientId;
      senderType = 'admin';
    } else {
      targetUserId = req.user.id;
      senderType = 'user';
      const count = await ChatMessage.countDocuments({ user: targetUserId, sender: 'user' });
      if (count === 0) alertAdmin(sender.fullName, sender.email, message.trim());
    }

    const newMessage = new ChatMessage({
      user: targetUserId,
      sender: senderType,
      message: message.trim(),
      read: false, // always starts unread for the recipient
    });

    await newMessage.save();
    res.json({ msg: 'MESSAGE_SENT', message: newMessage });
  } catch (err) {
    console.error('❌ Chat send error:', err);
    res.status(500).json({ msg: 'TRANSMISSION_FAILED', error: err.message });
  }
});

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
// Does NOT mark anything as read — read marking is done explicitly
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    const { userId } = req.query;
    let messages;

    if (requester.role === 'admin' && userId) {
      messages = await ChatMessage.find({ user: userId })
        .sort({ createdAt: 1 })
        .populate('user', 'fullName email');
    } else {
      messages = await ChatMessage.find({ user: req.user.id }).sort({ createdAt: 1 });
    }

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// ─── MARK READ FOR USER (called when user opens chat window) ──────────────────
// PUT /api/chat/mark-read-user
router.put('/mark-read-user', authMiddleware, async (req, res) => {
  try {
    await ChatMessage.updateMany(
      { user: req.user.id, sender: 'admin', read: false },
      { read: true }
    );
    res.json({ msg: 'MARKED_AS_READ' });
  } catch (err) {
    res.status(500).json({ msg: 'UPDATE_FAILED' });
  }
});

// ─── MARK READ FOR ADMIN (called when admin opens a user thread) ──────────────
// PUT /api/chat/mark-read/:userId
router.put('/mark-read/:userId', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'admin') return res.status(403).json({ msg: 'ADMIN_ONLY' });

    await ChatMessage.updateMany(
      { user: req.params.userId, sender: 'user', read: false },
      { read: true }
    );
    res.json({ msg: 'MARKED_AS_READ' });
  } catch (err) {
    res.status(500).json({ msg: 'UPDATE_FAILED' });
  }
});

// ─── GET CONVERSATIONS (admin inbox list) ─────────────────────────────────────
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'admin') return res.status(403).json({ msg: 'ADMIN_ONLY' });

    const conversations = await ChatMessage.aggregate([
      {
        $group: {
          _id: '$user',
          lastMessage: { $last: '$message' },
          lastMessageDate: { $last: '$createdAt' },
          lastSender: { $last: '$sender' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageDate: -1 } },
    ]);

    await User.populate(conversations, { path: '_id', select: 'fullName email' });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────────
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    let unreadCount = 0;

    if (requester.role === 'admin') {
      unreadCount = await ChatMessage.countDocuments({ sender: 'user', read: false });
    } else {
      unreadCount = await ChatMessage.countDocuments({
        user: req.user.id,
        sender: 'admin',
        read: false,
      });
    }

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ msg: 'COUNT_FAILED' });
  }
});

module.exports = router;
