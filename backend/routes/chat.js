// backend/routes/chat.js
const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Send email alert to admin
const alertAdmin = async (userName, userEmail) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'nirshuxcom@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await transporter.sendMail({
      from: '"Nirshux System" <nirshuxcom@gmail.com>',
      to: 'nirshuxcom@gmail.com',
      subject: '💬 New Chat Message from User',
      html: `
        <div style="font-family: monospace; background: #0A0A0A; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #00F2C3; text-transform: uppercase; font-weight: 900;">NIRSHUX CHAT ALERT</h1>
          <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 30px;">New Message Received</p>
          <div style="background: #1a1a1a; border: 2px solid #00F2C3; border-radius: 16px; padding: 30px; margin: 30px 0;">
            <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 10px;">From:</p>
            <h2 style="font-size: 24px; color: #00F2C3; font-weight: 900; margin: 0;">${userName}</h2>
            <p style="color: #666; font-size: 12px; margin-top: 5px;">${userEmail}</p>
          </div>
          <p style="color: #666; font-size: 11px;">Login to your admin dashboard to respond.</p>
        </div>
      `
    });
    console.log('📧 Admin alerted of new chat message');
  } catch (err) {
    console.error('❌ Admin chat alert failed:', err.message);
  }
};

// @route   POST /api/chat/send
// @desc    User or Admin sends a message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, recipientId } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ msg: 'MESSAGE_EMPTY' });
    }

    // Determine sender type and target user
    let targetUserId = req.user.id;
    let senderType = 'user';

    if (user.role === 'admin') {
      // Admin is sending to a specific user
      if (!recipientId) {
        return res.status(400).json({ msg: 'RECIPIENT_REQUIRED' });
      }
      targetUserId = recipientId;
      senderType = 'admin';
    } else {
      // User is sending to admin - alert admin via email
      await alertAdmin(user.fullName, user.email);
    }

    const newMessage = new ChatMessage({
      user: targetUserId,
      sender: senderType,
      message: message.trim()
    });

    await newMessage.save();
    res.json({ msg: 'MESSAGE_SENT', message: newMessage });
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ msg: 'TRANSMISSION_FAILED' });
  }
});

// @route   GET /api/chat/messages
// @desc    Get chat messages (user sees their own, admin sees specific user's)
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { userId } = req.query;

    let messages;

    if (user.role === 'admin' && userId) {
      // Admin viewing specific user's chat
      messages = await ChatMessage.find({ user: userId })
        .sort({ createdAt: 1 })
        .populate('user', 'fullName email');
    } else {
      // User viewing their own chat
      messages = await ChatMessage.find({ user: req.user.id })
        .sort({ createdAt: 1 });
    }

    res.json(messages);
  } catch (err) {
    console.error('Chat fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// @route   GET /api/chat/conversations
// @desc    Admin gets list of users who have messaged
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'ADMIN_ONLY' });
    }

    // Get unique user IDs who have sent messages
    const conversations = await ChatMessage.aggregate([
      {
        $group: {
          _id: '$user',
          lastMessage: { $last: '$message' },
          lastMessageDate: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$sender', 'user'] }, { $eq: ['$read', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { lastMessageDate: -1 } }
    ]);

    // Populate user details
    await ChatMessage.populate(conversations, { path: '_id', select: 'fullName email' });

    res.json(conversations);
  } catch (err) {
    console.error('Conversations fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// @route   PUT /api/chat/mark-read/:userId
// @desc    Admin marks messages from a user as read
router.put('/mark-read/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ msg: 'ADMIN_ONLY' });
    }

    await ChatMessage.updateMany(
      { user: req.params.userId, sender: 'user', read: false },
      { read: true }
    );

    res.json({ msg: 'MESSAGES_MARKED_READ' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ msg: 'UPDATE_FAILED' });
  }
});

module.exports = router;
