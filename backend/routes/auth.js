// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { nanoid } = require('nanoid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, ref } = req.body;
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const myReferralId = nanoid(6);

    const newUser = new User({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      plainPassword: password,
      referralId: myReferralId,
      referredBy: ref || null,
    });

    await newUser.save();
    res.status(201).json({ msg: 'Account created successfully!' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`🔍 Login attempt for: ${email}`);

    const user = await Promise.race([
      User.findOne({ email: email.toLowerCase() }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      ),
    ]);

    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'nirshux_secret_key',
      { expiresIn: '1d' }
    );

    console.log(`✅ Login successful for: ${email}`);
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role } });
  } catch (err) {
    console.error('❌ Login error:', err);
    if (err.message === 'Database query timeout') {
      return res.status(504).json({ msg: 'Server timeout. Please try again.' });
    }
    res.status(500).json({ msg: 'Server Error' });
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required.' });

    const user = await Promise.race([
      User.findOne({ email: email.trim().toLowerCase() }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      ),
    ]);

    if (!user) return res.status(404).json({ msg: 'Terminal error: User not found.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 600000;
    await user.save();

    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: 'nirshuxcom@gmail.com', pass: process.env.GMAIL_APP_PASSWORD },
      });

      await transporter.sendMail({
        from: '"Nirshux Terminal" <nirshuxcom@gmail.com>',
        to: user.email,
        subject: 'NIRSHUX - Password Reset Code',
        html: `
          <div style="font-family: monospace; background: #0A0A0A; color: #fff; padding: 40px; text-align: center;">
            <h1 style="color: #00F2C3; text-transform: uppercase; font-weight: 900;">NIRSHUX TERMINAL</h1>
            <p style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Password Reset Protocol</p>
            <div style="background: #1a1a1a; border: 2px solid #00F2C3; border-radius: 16px; padding: 30px; margin: 30px 0;">
              <p style="color: #999; font-size: 11px; text-transform: uppercase; margin-bottom: 20px;">Your Security Code:</p>
              <h2 style="font-size: 48px; letter-spacing: 8px; color: #00F2C3; font-weight: 900; margin: 0;">${otp}</h2>
            </div>
            <p style="color: #666; font-size: 11px;">This code expires in 10 minutes.</p>
          </div>
        `,
      });

      res.json({ msg: 'Reset protocol initiated. Check your email.' });
    } catch (emailError) {
      console.error('❌ Email error:', emailError);
      return res.status(500).json({ msg: 'Email delivery failed.' });
    }
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    if (err.message === 'Database query timeout') {
      return res.status(504).json({ msg: 'Database timeout. Please try again.' });
    }
    res.status(500).json({ msg: 'Internal server error.' });
  }
});

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ msg: 'Email and code are required.' });

    const user = await Promise.race([
      User.findOne({ email: email.trim().toLowerCase(), resetPasswordToken: code.trim() }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      ),
    ]);

    if (!user) return res.status(400).json({ msg: 'Invalid or expired code.' });
    if (Date.now() > user.resetPasswordExpire) {
      return res.status(400).json({ msg: 'Code has expired. Request a new one.' });
    }

    res.json({ msg: 'Security Clear. Code verified.' });
  } catch (err) {
    console.error('❌ Verify OTP error:', err);
    if (err.message === 'Database query timeout') {
      return res.status(504).json({ msg: 'Database timeout. Please try again.' });
    }
    res.status(500).json({ msg: 'Verification error.' });
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Email and password are required.' });

    const user = await Promise.race([
      User.findOne({ email: email.trim().toLowerCase() }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 15000)
      ),
    ]);

    if (!user) return res.status(404).json({ msg: 'User profile not found.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.plainPassword = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    if (err.message === 'Database query timeout') {
      return res.status(504).json({ msg: 'Database timeout. Please try again.' });
    }
    res.status(500).json({ msg: 'Update failed.' });
  }
});

module.exports = router;
