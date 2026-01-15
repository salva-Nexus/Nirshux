const Transaction = require('../models/Transaction');

exports.getTransactionHistory = async (req, res) => {
  try {
    // 1. Double check the User ID coming from middleware
    if (!req.user || !req.user.id) {
        return res.status(401).json({ msg: "Identity Verification Failed" });
    }

    // 2. Query transactions specifically for this user
    const history = await Transaction.find({ user: req.user.id })
      .sort({ date: -1 });

    // 3. Debug log to your Terminal (Check your VS Code terminal for this)
    console.log(`[HISTORY_SYSTEM] Found ${history.length} records for User ${req.user.id}`);

    res.json(history);
  } catch (err) {
    console.error("HISTORY_CONTROLLER_ERROR:", err.message);
    res.status(500).send('Server Error');
  }
};