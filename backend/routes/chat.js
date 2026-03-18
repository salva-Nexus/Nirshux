// backend/routes/chat.js
const router = require('express').Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const nodemailer = require('nodemailer');

// Send email alert to admin when user sends FIRST message
const alertAdmin = async (userName, userEmail, messageText) => {
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
      `
    });
    console.log(`📧 Admin alerted: New message from ${userName}`);
  } catch (err) {
    console.error('❌ Admin email alert failed:', err.message);
  }
};

// @route   POST /api/chat/send
// @desc    Send a chat message
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { message, recipientId } = req.body;
    
    console.log('📨 Chat send request:', { 
      userId: req.user.id, 
      hasMessage: !!message, 
      hasRecipient: !!recipientId 
    });

    // Validate message
    if (!message || message.trim() === '') {
      console.log('❌ Empty message');
      return res.status(400).json({ msg: 'MESSAGE_EMPTY' });
    }

    // Get sender
    const sender = await User.findById(req.user.id);
    if (!sender) {
      console.log('❌ Sender not found');
      return res.status(404).json({ msg: 'USER_NOT_FOUND' });
    }

    console.log(`👤 Sender: ${sender.fullName} (${sender.role})`);

    let targetUserId;
    let senderType;

    if (sender.role === 'admin') {
      // Admin sending to a user
      if (!recipientId) {
        console.log('❌ Admin missing recipientId');
        return res.status(400).json({ msg: 'RECIPIENT_REQUIRED' });
      }
      targetUserId = recipientId;
      senderType = 'admin';
      console.log(`✅ Admin → User: ${recipientId}`);
    } else {
      // User sending to admin
      targetUserId = req.user.id;
      senderType = 'user';
      console.log(`✅ User → Admin`);
      
      // Check if first message
      const previousMessages = await ChatMessage.find({ user: targetUserId });
      if (previousMessages.length === 0) {
        console.log('📧 First message - sending admin alert');
        await alertAdmin(sender.fullName, sender.email, message.trim());
      }
    }

    // Create message
    const newMessage = new ChatMessage({
      user: targetUserId,
      sender: senderType,
      message: message.trim(),
      read: senderType === 'admin'
    });

    await newMessage.save();
    console.log(`✅ Message saved: ${newMessage._id}`);
    
    // Populate for response
    await newMessage.populate('user', 'fullName email');

    res.json({ 
      msg: 'MESSAGE_SENT', 
      message: newMessage 
    });
  } catch (err) {
    console.error('❌ Chat send error:', err);
    res.status(500).json({ msg: 'TRANSMISSION_FAILED', error: err.message });
  }
});

// @route   GET /api/chat/messages
// @desc    Get messages for a conversation
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
      // Regular user viewing their own chat
      messages = await ChatMessage.find({ user: req.user.id })
        .sort({ createdAt: 1 });
    }

    res.json(messages);
  } catch (err) {
    console.error('❌ Messages fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// @route   GET /api/chat/conversations
// @desc    Admin gets list of users who have messaged
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    
    if (admin.role !== 'admin') {
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
                0
              ]
            }
          }
        }
      },
      { $sort: { lastMessageDate: -1 } }
    ]);

    await User.populate(conversations, { 
      path: '_id', 
      select: 'fullName email' 
    });

    res.json(conversations);
  } catch (err) {
    console.error('❌ Conversations fetch error:', err);
    res.status(500).json({ msg: 'FETCH_FAILED' });
  }
});

// @route   PUT /api/chat/mark-read/:userId
// @desc    Mark messages as read
router.put('/mark-read/:userId', authMiddleware, async (req, res) => {
  try {
    const admin = await User.findById(req.user.id);
    
    if (admin.role !== 'admin') {
      return res.status(403).json({ msg: 'ADMIN_ONLY' });
    }

    await ChatMessage.updateMany(
      { 
        user: req.params.userId, 
        sender: 'user', 
        read: false 
      },
      { read: true }
    );

    res.json({ msg: 'MARKED_AS_READ' });
  } catch (err) {
    console.error('❌ Mark read error:', err);
    res.status(500).json({ msg: 'UPDATE_FAILED' });
  }
});

// @route   GET /api/chat/unread-count
// @desc    Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let unreadCount = 0;

    if (user.role === 'admin') {
      unreadCount = await ChatMessage.countDocuments({
        sender: 'user',
        read: false
      });
    } else {
      unreadCount = await ChatMessage.countDocuments({
        user: req.user.id,
        sender: 'admin',
        read: false
      });
    }

    res.json({ unreadCount });
  } catch (err) {
    console.error('❌ Unread count error:', err);
    res.status(500).json({ msg: 'COUNT_FAILED' });
  }
});

module.exports = router;
