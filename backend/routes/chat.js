// backend/routes/chat.js
const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Send email alert to admin when user sends their FIRST message
const alertAdmin = async (userName, userEmail, messageText) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'nirshuxcom@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Nirshux System" <nirshuxcom@gmail.com>',
      to: 'nirshuxcom@gmail.com',
      subject: `💬 New Chat from ${userName}`,
      html: `
        <div style="font-family: monospace; background: #0A0A0A; color: #fff; padding: 40px;">
          <h1 style="color: #00F2C3; text-transform: uppercase; font-weight: 900; margin-bottom: 10px;">NIRSHUX CHAT ALERT</h1>
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px;">New Message Received</p>
          <div style="background: #1a1a1a; border: 2px solid #00F2C3; border-radius: 16px; padding: 30px; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 10px;">FROM:</p>
            <h2 style="font-size: 24px; color: #00F2C3; font-weight: 900; margin: 0 0 5px 0;">${userName}</h2>
            <p style="color: #666; font-size: 12px; margin-bottom: 20px;">${userEmail}</p>
            <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 10px;">MESSAGE:</p>
            <p style="color: #fff; font-size: 14px; background: #0A0A0A; padding: 15px; border-radius: 8px;">${messageText}</p>
          </div>
          <p style="color: #666; font-size: 11px; text-align: center;">Login to your admin dashboard to respond.</p>
        </div>
      `,
    });
    console.log(`📧 Admin alerted: new message from ${userName}`);
  } catch (err) {
    console.error('❌ Admin email alert failed:', err.message);
  }
};

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
// POST /api/chat/send
// Body: { message, recipientId? }
//   - User sends: recipientId is NOT required (always goes to admin thread)
//   - Admin sends: recipientId IS required (targets a specific user's thread)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, recipientId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ msg: 'MESSAGE_EMPTY' });
    }

    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ msg: 'USER_NOT_FOUND' });

    let targetUserId;   // The "conversation owner" (always the non-admin user)
    let senderType;

    if (sender.role === 'admin') {
      // Admin → User
      if (!recipientId) {
        return res.status(400).json({ msg: 'RECIPIENT_REQUIRED_FOR_ADMIN' });
      }
      targetUserId = recipientId;  // Store under the user's ID
      senderType = 'admin';
    } else {
      // User → Admin
      targetUserId = req.user.id;  // Store under this user's own ID
      senderType = 'user';

      // First-message email alert
      const count = await ChatMessage.countDocuments({ user: targetUserId, sender: 'user' });
      if (count === 0) {
        alertAdmin(sender.fullName, sender.email, message.trim()); // fire-and-forget
      }
    }

    const newMessage = new ChatMessage({
      user: targetUserId,
      sender: senderType,
      message: message.trim(),
      read: senderType === 'admin', // admin messages start as "read" by admin
    });

    await newMessage.save();

    res.json({ msg: 'MESSAGE_SENT', message: newMessage });
  } catch (err) {
    console.error('❌ Chat send error:', err);
    res.status(500).json({ msg: 'TRANSMISSION_FAILED', error: err.message });
  }
});

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
// GET /api/chat/messages
// Query: ?userId=<id>  (admin only, to view a specific user's thread)
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    const { userId } = req.query;

    let messages;

    if (requester.role === 'admin' && userId) {
      // Admin viewing a user's thread
      messages = await ChatMessage.find({ user: userId })
        .sort({ createdAt: 1 })
        .populate('user', 'fullName email');
    } else {
      // Regular user viewing their own thread
      messages = await ChatMessage.find({ user: req.user.id }).sort({ createdAt: 1 });

      // Mark admin messages as read (user opened the chat)
      await ChatMessage.updateMany(
        { user: req.user.id, sender: 'admin', read: false },
        { read: true }
      );
    }

    res.json(messages);
  } catch (err) {
    console.error('❌ Messages fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// ─── GET CONVERSATIONS (admin inbox list) ────────────────────────────────────
// GET /api/chat/conversations
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'admin') {
      return res.status(403).json({ msg: 'ADMIN_ONLY' });
    }

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

    // Populate the user details
    await User.populate(conversations, { path: '_id', select: 'fullName email' });

    res.json(conversations);
  } catch (err) {
    console.error('❌ Conversations fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// ─── MARK AS READ ─────────────────────────────────────────────────────────────
// PUT /api/chat/mark-read/:userId
router.put('/mark-read/:userId', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== 'admin') {
      return res.status(403).json({ msg: 'ADMIN_ONLY' });
    }

    await ChatMessage.updateMany(
      { user: req.params.userId, sender: 'user', read: false },
      { read: true }
    );

    res.json({ msg: 'MARKED_AS_READ' });
  } catch (err) {
    console.error('❌ Mark read error:', err);
    res.status(500).json({ msg: 'UPDATE_FAILED' });
  }
});

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────────
// GET /api/chat/unread-count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    let unreadCount = 0;

    if (requester.role === 'admin') {
      // Admin: count all unread user messages across all threads
      unreadCount = await ChatMessage.countDocuments({ sender: 'user', read: false });
    } else {
      // User: count unread admin replies in their own thread
      unreadCount = await ChatMessage.countDocuments({
        user: req.user.id,
        sender: 'admin',
        read: false,
      });
    }

    res.json({ unreadCount });
  } catch (err) {
    console.error('❌ Unread count error:', err);
    res.status(500).json({ msg: 'COUNT_FAILED' });
  }
});

module.exports = router;
