// backend/routes/investor.js
const router = require('express').Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const authMiddleware = require('../middleware/auth');
const historyController = require('../controllers/historyController');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// --- 1. PROFILE ROUTE ---
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate({
        path: 'transactions',
        options: { sort: { date: -1 } }
      });
    
    if (!user) return res.status(404).json({ msg: "User profile not found" });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error fetching profile");
  }
});

// --- 2. DEPOSIT ROUTES ---
router.get('/whitelisted-wallets', authMiddleware, async (req, res) => {
  try {
    const wallets = await Wallet.find(); 
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ msg: "Server Error fetching gateways" });
  }
});

router.post('/deposit-request', authMiddleware, async (req, res) => {
  try {
    const { amount, coin, network } = req.body;
    const user = await User.findById(req.user.id);

    const newTrx = new Transaction({
      user: req.user.id,
      type: 'deposit',
      amount: Number(amount),
      coin,
      network,
      status: 'pending'
    });

    const savedTrx = await newTrx.save();
    user.transactions.push(savedTrx._id);
    await user.save();

    res.status(200).json({ msg: "Deposit protocol initiated." });
  } catch (err) {
    res.status(500).json({ msg: "Deposit Request Failed." });
  }
});

// --- 3. INVESTMENT ROUTE ---
router.post('/invest', authMiddleware, async (req, res) => {
  try {
    const { amount, planName, dailyRoi, durationDays } = req.body;

    if (!amount || !planName) {
      return res.status(400).json({ msg: "INVALID_INVESTMENT_DATA" });
    }

    const investor = await User.findById(req.user.id);
    const investAmount = Number(amount);

    if (investor.balance < investAmount) return res.status(400).json({ msg: "Insufficient balance." });

    investor.balance -= investAmount;
    investor.totalInvested += investAmount;

    if (!investor.hasMadeFirstInvestment) {
      investor.balance += 30;

      if (investor.referredBy) {
        const referrer = await User.findOne({ referralId: investor.referredBy });
        if (referrer) {
          const rewardAmount = investAmount * 0.025;
          referrer.balance += rewardAmount;
          referrer.referralBalance += rewardAmount;

          const refTrx = new Transaction({
            user: referrer._id,
            type: 'referral_bonus',
            amount: rewardAmount,
            status: 'success',
            coin: 'USD (Internal)',
            network: `Bonus from ${investor.fullName}`,
          });
          const savedRefTrx = await refTrx.save();
          referrer.transactions.push(savedRefTrx._id);

          await referrer.save();
          console.log(`Referral reward of $${rewardAmount} sent to ${referrer.email}`);
        }
      }
      
      investor.hasMadeFirstInvestment = true;
      console.log(`First investment bonus ($30) applied to ${investor.email}`);
    }

    const endDate = new Date();
    const daysToAdd = durationDays === "Unlimited" ? 36500 : parseInt(durationDays);
    endDate.setDate(endDate.getDate() + daysToAdd);

    investor.activeInvestments.push({
      planName,
      amount: investAmount,
      dailyRoi,
      startDate: new Date(),
      endDate,
      lastPayout: new Date(),
      status: 'active'
    });

    const investTrx = new Transaction({
      user: investor._id,
      type: 'investment',
      amount: investAmount,
      plan: planName,
      status: 'success',
      coin: 'USD (Internal)',
      network: 'Nirshux Protocol'
    });
    
    const savedTrx = await investTrx.save();
    investor.transactions.push(savedTrx._id);

    await investor.save();
    res.status(200).json({ msg: `Staked $${investAmount} successfully. Protocol rewards applied.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Investment Protocol Error." });
  }
});

// --- 4. WITHDRAWAL REQUEST ---
router.post('/withdraw-request', authMiddleware, async (req, res) => {
  try {
    const { amount, coin, network, addressUsed } = req.body;
    const user = await User.findById(req.user.id);

    if (user.balance < amount) return res.status(400).json({ msg: "INSUFFICIENT_FUNDS" });

    const newTrx = new Transaction({
      user: user._id,
      type: 'withdrawal',
      amount,
      coin,
      network,
      addressUsed,
      status: 'pending'
    });

    const savedTrx = await newTrx.save();
    user.transactions.push(savedTrx._id);
    await user.save();

    res.json({ msg: "WITHDRAWAL_REQUEST_QUEUED" });
  } catch (err) {
    res.status(500).json({ msg: "TRANSMISSION_ERROR" });
  }
});

// --- 5. FORENSIC HISTORY ---
router.get('/history', authMiddleware, historyController.getTransactionHistory);

// --- 6. UPDATE FULL NAME ---
router.put('/update-name', authMiddleware, async (req, res) => {
  try {
    const { fullName } = req.body;
    if (!fullName) return res.status(400).json({ msg: "Name is required." });

    const user = await User.findById(req.user.id);
    user.fullName = fullName;
    await user.save();

    res.json({ msg: "IDENTITY_UPDATED", fullName: user.fullName });
  } catch (err) {
    res.status(500).json({ msg: "SYSTEM_FAILURE_UPDATE" });
  }
});

// --- 7. EMAIL CHANGE - PHASE 1: REQUEST CODE ---
router.post('/request-email-update', authMiddleware, async (req, res) => {
  try {
    const { oldEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (user.email !== oldEmail.trim().toLowerCase()) {
      return res.status(400).json({ msg: "IDENTIFICATION_MISMATCH" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 600000; // 10 minutes
    await user.save();

    console.log(`Email change OTP for ${oldEmail}: ${otp}`); // Debug log

    // Send email
    try {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'nirshuxcom@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD // Your app password (without spaces)
        }
      });

      await transporter.sendMail({
        from: '"Nirshux Terminal" <nirshuxcom@gmail.com>',
        to: oldEmail,
        subject: 'NIRSHUX - Email Change Security Code',
        html: `
          <div style="font-family: monospace; background: #0A0A0A; color: #fff; padding: 40px; text-align: center;">
            <h1 style="color: #00F2C3; text-transform: uppercase; font-weight: 900;">NIRSHUX TERMINAL</h1>
            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Email Change Verification</p>
            <div style="background: #1a1a1a; border: 2px solid #00F2C3; border-radius: 16px; padding: 30px; margin: 30px 0;">
              <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 20px;">Your Security Code:</p>
              <h2 style="font-size: 48px; letter-spacing: 8px; color: #00F2C3; font-weight: 900; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 11px;">This code expires in 10 minutes.</p>
            <p style="color: #444; font-size: 10px; margin-top: 40px;">If you didn't request this, ignore this message.</p>
          </div>
        `
      });

      console.log('Email change code sent successfully');
      res.json({ msg: "SECURITY_CODE_SENT_TO_OLD_EMAIL" });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({ msg: "EMAIL_DELIVERY_FAILED" });
    }
  } catch (err) {
    console.error('Request email update error:', err);
    res.status(500).json({ msg: "TRANSMISSION_ERROR" });
  }
});

// --- 8. EMAIL CHANGE - PHASE 2: VERIFY CODE ---
router.post('/verify-update-code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.resetPasswordToken || user.resetPasswordToken !== code.trim()) {
      return res.status(400).json({ msg: "INVALID_SECURITY_CODE" });
    }

    if (Date.now() > user.resetPasswordExpire) {
      return res.status(400).json({ msg: "CODE_EXPIRED" });
    }

    res.json({ msg: "CODE_VERIFIED_ACCESS_GRANTED" });
  } catch (err) {
    console.error('Verify code error:', err);
    res.status(500).json({ msg: "SERVER_ERROR" });
  }
});

// --- 9. EMAIL CHANGE - PHASE 3: FINALIZE ---
router.put('/confirm-email-update', authMiddleware, async (req, res) => {
  try {
    const { code, newEmail } = req.body;
    const user = await User.findById(req.user.id);

    // Verify code again
    if (!user.resetPasswordToken || user.resetPasswordToken !== code.trim()) {
      return res.status(400).json({ msg: "INVALID_OR_EXPIRED_CODE" });
    }

    if (Date.now() > user.resetPasswordExpire) {
      return res.status(400).json({ msg: "CODE_EXPIRED" });
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ msg: "EMAIL_ALREADY_IN_USE" });
    }

    // Update email
    user.email = newEmail.toLowerCase();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: "EMAIL_PROTOCOL_REWRITTEN" });
  } catch (err) {
    console.error('Confirm email update error:', err);
    res.status(500).json({ msg: "SERVER_SECURITY_ERROR" });
  }
});

module.exports = router;