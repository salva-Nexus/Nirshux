// backend/routes/admin.js
const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const authMiddleware = require('../middleware/auth');

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') return res.status(403).json({ msg: "UNAUTHORIZED_ACCESS" });
    next();
  } catch (err) { res.status(500).json({ msg: "SECURITY_ERROR" }); }
};

// --- USER OPERATIONS ---

// GET all users — explicitly select plainPassword so the admin panel can display it
router.get('/users', [authMiddleware, adminOnly], async (req, res) => {
  try {
    // select('-password') removes the bcrypt hash but KEEPS plainPassword (different field)
    // Being explicit here to make it obvious and avoid future confusion
    const users = await User.find()
      .select('-password')  // strips hashed password only; plainPassword is a separate field
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "REGISTRY_SYNC_FAILED" });
  }
});

router.delete('/user/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ msg: "SELF_TERMINATION_DENIED" });
    await Transaction.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "SUBJECT_PURGED" });
  } catch (err) { res.status(500).json({ msg: "PURGE_FAILED" }); }
});

// @route   PUT api/admin/user/adjust-balance/:id
// @desc    Manually increase/decrease user balance
router.put('/user/adjust-balance/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { amount } = req.body;
    if (isNaN(amount)) return res.status(400).json({ msg: "INVALID_AMOUNT" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

    user.balance += Number(amount);
    if (user.balance < 0) user.balance = 0;

    await user.save();
    res.json({ msg: "LIQUIDITY_ADJUSTED", newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ msg: "MUTATION_FAILED" });
  }
});

// @route   PUT api/admin/user/adjust-total-earned/:id
// @desc    Manually adjust user's total earned stat
router.put('/user/adjust-total-earned/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const { amount } = req.body;
    if (isNaN(amount)) return res.status(400).json({ msg: "INVALID_AMOUNT" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

    user.totalEarned += Number(amount);
    if (user.totalEarned < 0) user.totalEarned = 0;

    await user.save();
    res.json({ msg: "TOTAL_EARNED_ADJUSTED", newTotalEarned: user.totalEarned });
  } catch (err) {
    res.status(500).json({ msg: "MUTATION_FAILED" });
  }
});

// --- DEPOSIT OPERATIONS ---

// GET ALL PENDING DEPOSITS
router.get('/pending-deposits', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const pending = await Transaction.find({ type: 'deposit', status: 'pending' })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ msg: "DEPOSIT_FETCH_FAILED" });
  }
});

// @route   PUT api/admin/deposit/approve/:id
router.put('/deposit/approve/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });
    if (trx.status !== 'pending') return res.status(400).json({ msg: "ALREADY_PROCESSED" });

    const user = await User.findById(trx.user);
    if (!user) return res.status(404).json({ msg: "USER_NOT_FOUND" });

    user.balance += trx.amount;
    user.totalDeposited = (user.totalDeposited || 0) + trx.amount;
    trx.status = 'success';

    await user.save();
    await trx.save();

    res.json({ msg: "FUNDS_AUTHORIZED_SUCCESSFULLY" });
  } catch (err) {
    res.status(500).json({ msg: "APPROVAL_FAILED" });
  }
});

// @route   PUT api/admin/deposit/reject/:id
router.put('/deposit/reject/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });

    trx.status = 'failed';
    await trx.save();

    res.json({ msg: "DEPOSIT_REJECTED" });
  } catch (err) {
    res.status(500).json({ msg: "REJECTION_FAILED" });
  }
});

// --- WITHDRAWAL OPERATIONS ---

// GET ALL PENDING WITHDRAWALS
router.get('/pending-withdrawals', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const pending = await Transaction.find({ type: 'withdrawal', status: 'pending' })
      .populate('user', 'fullName email')
      .sort({ createdAt: -1 });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ msg: "WITHDRAWAL_FETCH_FAILED" });
  }
});

// @route   PUT api/admin/withdrawal/approve/:id
router.put('/withdrawal/approve/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });
    if (trx.status !== 'pending') return res.status(400).json({ msg: "ALREADY_PROCESSED" });

    const user = await User.findById(trx.user);
    if (!user) return res.status(404).json({ msg: "USER_NOT_FOUND" });

    if (user.balance < trx.amount) {
      trx.status = 'failed';
      await trx.save();
      return res.status(400).json({ msg: "INSUFFICIENT_USER_BALANCE" });
    }

    user.balance -= trx.amount;
    user.withdrawn = (user.withdrawn || 0) + trx.amount;
    trx.status = 'success';

    await user.save();
    await trx.save();

    res.json({ msg: "WITHDRAWAL_EXECUTED_SUCCESSFULLY" });
  } catch (err) {
    res.status(500).json({ msg: "WITHDRAWAL_APPROVAL_FAILED" });
  }
});

// @route   PUT api/admin/withdrawal/reject/:id
router.put('/withdrawal/reject/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const trx = await Transaction.findById(req.params.id);
    if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });

    trx.status = 'failed';
    await trx.save();

    res.json({ msg: "WITHDRAWAL_REJECTED" });
  } catch (err) {
    res.status(500).json({ msg: "REJECTION_FAILED" });
  }
});

// --- WALLET / ASSET OPERATIONS ---

router.get('/wallets', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ createdAt: -1 });
    res.json(wallets);
  } catch (err) { res.status(500).json({ msg: "ASSET_FETCH_FAILED" }); }
});

router.post('/whitelist-wallet', [authMiddleware, adminOnly], async (req, res) => {
  try {
    const newWallet = new Wallet(req.body);
    await newWallet.save();
    res.json({ msg: "ASSET_AUTHORIZED" });
  } catch (err) { res.status(500).json({ msg: "AUTHORIZATION_FAILED" }); }
});

router.delete('/wallet/:id', [authMiddleware, adminOnly], async (req, res) => {
  try {
    await Wallet.findByIdAndDelete(req.params.id);
    res.json({ msg: "ASSET_DE_LISTED" });
  } catch (err) { res.status(500).json({ msg: "REVOCATION_FAILED" }); }
});

module.exports = router;
