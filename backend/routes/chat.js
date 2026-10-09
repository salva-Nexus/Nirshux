// backend/routes/chat.js
const router = require("express").Router();
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const { notifyAdmin, notifyUserChatReply } = require("../utils/notify");

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { message, recipientId } = req.body;
    if (typeof message !== "string" || !message.trim())
      return res.status(400).json({ msg: "MESSAGE_EMPTY" });

    const cleanMessage = message.trim();

    const sender = await User.findById(req.user.id);
    if (!sender) return res.status(404).json({ msg: "USER_NOT_FOUND" });

    let targetUserId;
    let senderType;

    if (sender.role === "admin") {
      if (!recipientId)
        return res.status(400).json({ msg: "RECIPIENT_REQUIRED_FOR_ADMIN" });
      targetUserId = recipientId;
      senderType = "admin";
    } else {
      targetUserId = req.user.id;
      senderType = "user";
    }

    const newMessage = new ChatMessage({
      user: targetUserId,
      sender: senderType,
      message: cleanMessage,
      read: false, // always starts unread for the recipient
    });

    await newMessage.save();

    // ── Notifications (awaited; both helpers never throw) ──
    if (senderType === "user") {
      // User → admin: email + push (every message)
      await notifyAdmin({
        event: "chat",
        title: `Message from ${sender.fullName}`,
        body: cleanMessage.slice(0, 180),
        rows: [
          ["User", sender.fullName],
          ["Email", sender.email],
        ],
        url: "/dashboard",
      });
    } else {
      // Admin → user: email
      const target = await User.findById(targetUserId).select("fullName email");
      if (target && target.email) {
        await notifyUserChatReply({
          toEmail: target.email,
          userName: target.fullName,
          message: cleanMessage,
        });
      }
    }

    res.json({ msg: "MESSAGE_SENT", message: newMessage });
  } catch (err) {
    console.error("❌ Chat send error:", err);
    res.status(500).json({ msg: "TRANSMISSION_FAILED", error: err.message });
  }
});

// ─── GET MESSAGES ─────────────────────────────────────────────────────────────
// Does NOT mark anything as read — read marking is done explicitly
router.get("/messages", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    const { userId } = req.query;
    let messages;

    if (requester.role === "admin" && userId) {
      messages = await ChatMessage.find({ user: userId })
        .sort({ createdAt: 1 })
        .populate("user", "fullName email");
    } else {
      messages = await ChatMessage.find({ user: req.user.id }).sort({
        createdAt: 1,
      });
    }

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "FETCH_FAILED" });
  }
});

// ─── MARK READ FOR USER (called when user opens chat window) ──────────────────
// PUT /api/chat/mark-read-user
router.put("/mark-read-user", authMiddleware, async (req, res) => {
  try {
    await ChatMessage.updateMany(
      { user: req.user.id, sender: "admin", read: false },
      { read: true },
    );
    res.json({ msg: "MARKED_AS_READ" });
  } catch (err) {
    res.status(500).json({ msg: "UPDATE_FAILED" });
  }
});

// ─── MARK READ FOR ADMIN (called when admin opens a user thread) ──────────────
// PUT /api/chat/mark-read/:userId
router.put("/mark-read/:userId", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== "admin")
      return res.status(403).json({ msg: "ADMIN_ONLY" });

    await ChatMessage.updateMany(
      { user: req.params.userId, sender: "user", read: false },
      { read: true },
    );
    res.json({ msg: "MARKED_AS_READ" });
  } catch (err) {
    res.status(500).json({ msg: "UPDATE_FAILED" });
  }
});

// ─── GET CONVERSATIONS (admin inbox list) ─────────────────────────────────────
router.get("/conversations", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    if (requester.role !== "admin")
      return res.status(403).json({ msg: "ADMIN_ONLY" });

    const conversations = await ChatMessage.aggregate([
      {
        $group: {
          _id: "$user",
          lastMessage: { $last: "$message" },
          lastMessageDate: { $last: "$createdAt" },
          lastSender: { $last: "$sender" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$sender", "user"] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastMessageDate: -1 } },
    ]);

    await User.populate(conversations, {
      path: "_id",
      select: "fullName email",
    });
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ msg: "FETCH_FAILED" });
  }
});

// ─── UNREAD COUNT ─────────────────────────────────────────────────────────────
router.get("/unread-count", authMiddleware, async (req, res) => {
  try {
    const requester = await User.findById(req.user.id);
    let unreadCount = 0;

    if (requester.role === "admin") {
      unreadCount = await ChatMessage.countDocuments({
        sender: "user",
        read: false,
      });
    } else {
      unreadCount = await ChatMessage.countDocuments({
        user: req.user.id,
        sender: "admin",
        read: false,
      });
    }

    res.json({ unreadCount });
  } catch (err) {
    res.status(500).json({ msg: "COUNT_FAILED" });
  }
});

module.exports = router;
