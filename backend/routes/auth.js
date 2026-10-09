// backend/routes/auth.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const User = require("../models/User");
const { nanoid } = require("nanoid");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { sendMail, notifyAdmin } = require("../utils/notify");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// No fallback secret: if JWT_SECRET is missing the server must refuse to run,
// otherwise anyone who knows the fallback string can forge an admin token.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");

const TOKEN_TTL = "1d"; // server-side expiry, slightly longer than the 5-minute frontend session
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5; // wrong guesses allowed per issued code

// ─── RATE LIMITERS ────────────────────────────────────────────────────────────
const makeLimiter = (windowMs, max, msg) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg },
  });

const loginLimiter = makeLimiter(
  15 * 60 * 1000,
  10,
  "Too many login attempts. Try again in 15 minutes.",
);
const registerLimiter = makeLimiter(
  60 * 60 * 1000,
  10,
  "Too many sign-ups from this network. Try again later.",
);
const otpRequestLimiter = makeLimiter(
  15 * 60 * 1000,
  5,
  "Too many reset requests. Try again in 15 minutes.",
);
const otpVerifyLimiter = makeLimiter(
  15 * 60 * 1000,
  10,
  "Too many verification attempts. Try again in 15 minutes.",
);

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const isStr = (v) => typeof v === "string";
const normEmail = (v) => v.trim().toLowerCase();

const withDbTimeout = (query, ms = 15000) => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Database query timeout")), ms);
  });
  return Promise.race([query, timeout]).finally(() => clearTimeout(timer));
};

const handleError = (res, err, label, fallbackMsg) => {
  console.error(`❌ ${label}:`, err);
  if (err && err.message === "Database query timeout") {
    return res.status(504).json({ msg: "Database timeout. Please try again." });
  }
  return res.status(500).json({ msg: fallbackMsg });
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const clearResetState = (user) => {
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordAttempts = 0;
};

// Single source of truth for OTP validation. Used by BOTH /verify-otp and
// /reset-password so the code can never be skipped.
const validateResetCode = async (user, code) => {
  const INVALID = { ok: false, msg: "Invalid or expired code." };

  if (!user || !user.resetPasswordToken || !user.resetPasswordExpire)
    return INVALID;

  if (Date.now() > new Date(user.resetPasswordExpire).getTime()) {
    clearResetState(user);
    await user.save();
    return { ok: false, msg: "Code has expired. Request a new one." };
  }

  if ((user.resetPasswordAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    clearResetState(user);
    await user.save();
    return {
      ok: false,
      msg: "Too many incorrect attempts. Request a new code.",
    };
  }

  if (!/^\d{6}$/.test(code) || !safeEqual(user.resetPasswordToken, code)) {
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    await user.save();
    return INVALID;
  }

  return { ok: true };
};

// Goes through the shared Gmail mailer. Resolves true/false, never throws.
const sendOtpEmail = (to, otp) =>
  sendMail({
    to,
    subject: "NIRSHUX - Password Reset Code",
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

// ─── REGISTER ─────────────────────────────────────────────────────────────────
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { fullName, email, password, ref } = req.body;
    if (
      !isStr(fullName) ||
      !isStr(email) ||
      !isStr(password) ||
      !fullName.trim() ||
      !email.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ msg: "Full name, email and password are required." });
    }

    const cleanEmail = normEmail(email);
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const myReferralId = nanoid(6);

    const newUser = new User({
      fullName: fullName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      plainPassword: password,
      referralId: myReferralId,
      referredBy: isStr(ref) && ref ? ref : null,
    });

    await newUser.save();

    // Email + push to admin. Awaited (serverless freezes after the response),
    // never throws, so it can never break a successful registration.
    await notifyAdmin({
      event: "register",
      title: "New User Registered",
      body: `${newUser.fullName} (${newUser.email}) just created an account.`,
      rows: [
        ["Name", newUser.fullName],
        ["Email", newUser.email],
        ["Referred By", newUser.referredBy || "—"],
      ],
      url: "/admin-panel",
    });

    res.status(201).json({ msg: "Account created successfully!" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ msg: "Server Error" });
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isStr(email) || !isStr(password) || !email.trim() || !password) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const user = await withDbTimeout(User.findOne({ email: normEmail(email) }));
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: TOKEN_TTL,
    });

    // Don't notify the admin about their own logins.
    if (user.role !== "admin") {
      await notifyAdmin({
        event: "login",
        title: "User Logged In",
        body: `${user.fullName} (${user.email}) just signed in.`,
        rows: [
          ["Name", user.fullName],
          ["Email", user.email],
          ["IP", req.ip || "—"],
          ["Device", String(req.get("user-agent") || "—").slice(0, 80)],
        ],
        url: "/admin-panel",
      });
    }

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    return handleError(res, err, "Login error", "Server Error");
  }
});

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
// Always answers with the same success message so this route can't be used to
// discover which emails (e.g. the admin's) are registered.
router.post("/forgot-password", otpRequestLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!isStr(email) || !email.trim())
      return res.status(400).json({ msg: "Email is required." });

    const user = await withDbTimeout(User.findOne({ email: normEmail(email) }));

    if (user) {
      const otp = generateOtp();
      user.resetPasswordToken = otp;
      user.resetPasswordExpire = new Date(Date.now() + OTP_TTL_MS);
      user.resetPasswordAttempts = 0;
      await user.save();

      const sent = await sendOtpEmail(user.email, otp);
      if (!sent)
        console.error("❌ Reset email delivery failed for", user.email);
    }

    res.json({ msg: "Reset protocol initiated. Check your email." });
  } catch (err) {
    return handleError(
      res,
      err,
      "Forgot password error",
      "Internal server error.",
    );
  }
});

// ─── VERIFY OTP (UX step only — does NOT grant anything by itself) ─────────────
router.post("/verify-otp", otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!isStr(email) || !isStr(code) || !email.trim() || !code.trim()) {
      return res.status(400).json({ msg: "Email and code are required." });
    }

    const user = await withDbTimeout(User.findOne({ email: normEmail(email) }));
    const check = await validateResetCode(user, code.trim());
    if (!check.ok) return res.status(400).json({ msg: check.msg });

    res.json({ msg: "Security Clear. Code verified." });
  } catch (err) {
    return handleError(res, err, "Verify OTP error", "Verification error.");
  }
});

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
// The OTP is re-validated HERE, server-side, on every call. Without a valid,
// unexpired, unconsumed code for this exact email nothing is changed.
router.post("/reset-password", otpVerifyLimiter, async (req, res) => {
  try {
    const { email, code, password } = req.body;
    if (
      !isStr(email) ||
      !isStr(code) ||
      !isStr(password) ||
      !email.trim() ||
      !code.trim() ||
      !password
    ) {
      return res
        .status(400)
        .json({ msg: "Email, code and password are required." });
    }

    const user = await withDbTimeout(User.findOne({ email: normEmail(email) }));
    const check = await validateResetCode(user, code.trim());
    if (!check.ok) return res.status(400).json({ msg: check.msg });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.plainPassword = password;
    clearResetState(user); // single-use: code is burned on success
    await user.save();

    res.json({ msg: "Password updated successfully." });
  } catch (err) {
    return handleError(res, err, "Reset password error", "Update failed.");
  }
});

module.exports = router;
