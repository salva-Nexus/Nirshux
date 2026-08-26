// backend/routes/investor.js
const router = require("express").Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const authMiddleware = require("../middleware/auth");
const historyController = require("../controllers/historyController");
const { createClient } = require("@supabase/supabase-js");
const nodemailer = require("nodemailer");

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

// --- SECURE ROI CALCULATION FUNCTION --- (REPLACE THE ENTIRE FUNCTION)
const calculateRoi = async (user) => {
  const now = new Date();
  const lastCalc = new Date(user.lastRoiCalculation || user.createdAt);
  const daysElapsed = Math.floor((now - lastCalc) / (1000 * 60 * 60 * 24));

  if (daysElapsed === 0) return; // No days passed, skip calculation

  let needsUpdate = false;
  let totalReleased = 0;
  let totalNewAccrued = 0; // Track new accrued profits

  for (let inv of user.activeInvestments) {
    if (inv.status !== "active") continue;

    const planStartDate = new Date(inv.startDate);
    const planEndDate = new Date(inv.endDate);
    const dailyProfit = inv.amount * (inv.dailyRoi / 100);

    // CRITICAL FIX: Check maturity FIRST to determine calculation strategy
    const isPlanMatured = now >= planEndDate;

    // IF-ELSE STRUCTURE FOR SECURE CALCULATION
    if (isPlanMatured) {
      // MATURE PLAN: Calculate from max(lastCalc, planStartDate) to maturity date ONLY
      // 🔒 Same fix as the active branch — never accrue before the plan actually started.
      const accrualStart = Math.max(
        lastCalc.getTime(),
        planStartDate.getTime(),
      );
      const daysToMaturity = Math.floor(
        (planEndDate - accrualStart) / (1000 * 60 * 60 * 24),
      );
      const safeDaysToAccrue = Math.max(0, daysToMaturity);

      if (safeDaysToAccrue > 0) {
        const profitToAdd = dailyProfit * safeDaysToAccrue;
        inv.accrued = (inv.accrued || 0) + profitToAdd;
        inv.lastPayout = planEndDate; // Set to maturity date
        needsUpdate = true;
        totalNewAccrued += profitToAdd; // Add to total earned tracker

        console.log(
          `📈 ${user.email}: ${inv.planName} [MATURED] → +${profitToAdd.toFixed(2)} (${safeDaysToAccrue} days × ${dailyProfit.toFixed(2)}/day) | Total Accrued: ${inv.accrued.toFixed(2)}`,
        );
      }

      // NOW process the maturity release
      const totalRelease = inv.amount + inv.accrued;

      // MATURITY PROTOCOL - Only add principal + accrued to balance (NO duplicate totalEarned update)
      user.balance += totalRelease;
      totalReleased += totalRelease;

      // ✅ FIX: Wrap transaction save in try-catch to prevent blocking
      try {
        const releaseTrx = new Transaction({
          user: user._id,
          type: "maturity_release", // ✅ NOW VALID IN SCHEMA
          amount: totalRelease,
          coin: `USD (${inv.planName} Matured)`,
          network: "Nirshux Protocol",
          status: "success",
        });
        await releaseTrx.save();
        user.transactions.push(releaseTrx._id);
      } catch (trxError) {
        console.error(
          `❌ Failed to save maturity transaction for ${user.email}:`,
          trxError.message,
        );
        // Continue anyway - balance was already updated
      }

      inv.status = "completed";
      console.log(
        `💰 ${user.email}: ${inv.planName} MATURED → Released ${totalRelease.toFixed(2)} (Principal: ${inv.amount}, Profit: ${inv.accrued.toFixed(2)})`,
      );
    } else {
      // ACTIVE PLAN: Calculate from max(lastCalc, planStartDate) to NOW
      // 🔒 CRITICAL FIX: an investment can NEVER accrue profit for time before it existed.
      // Previously this used the raw global `lastCalc`, which let a brand-new investment
      // get backdated all the way to a stale lastRoiCalculation timestamp — this is what
      // caused the $19k phantom profit injection.
      const accrualStart = Math.max(
        lastCalc.getTime(),
        planStartDate.getTime(),
      );
      const daysToAccrue = Math.floor(
        (now - accrualStart) / (1000 * 60 * 60 * 24),
      );
      const safeDaysToAccrue = Math.max(0, daysToAccrue);

      if (safeDaysToAccrue > 0) {
        const profitToAdd = dailyProfit * safeDaysToAccrue;
        inv.accrued = (inv.accrued || 0) + profitToAdd;
        inv.lastPayout = now; // Set to current time
        needsUpdate = true;
        totalNewAccrued += profitToAdd; // Add to total earned tracker

        console.log(
          `📈 ${user.email}: ${inv.planName} [ACTIVE] → +${profitToAdd.toFixed(2)} (${safeDaysToAccrue} days × ${dailyProfit.toFixed(2)}/day) | Total Accrued: ${inv.accrued.toFixed(2)}`,
        );
      }
    }
  }

  if (needsUpdate) {
    // UPDATE TOTAL EARNED WITH ALL NEW ACCRUED PROFITS
    user.totalEarned += totalNewAccrued;

    // Remove completed plans
    user.activeInvestments = user.activeInvestments.filter(
      (inv) => inv.status === "active",
    );
    user.lastRoiCalculation = now;
    await user.save();

    if (totalReleased > 0) {
      console.log(
        `✅ ${user.email}: Maturity Protocol Complete → $${totalReleased.toFixed(2)} sent to balance`,
      );
    }
    if (totalNewAccrued > 0) {
      console.log(
        `💎 ${user.email}: Total Earned Updated → +$${totalNewAccrued.toFixed(2)}`,
      );
    }
  }
};

const sendAdminAlert = async (type, details) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // ✅ FIX: matches auth.js — 587 was ETIMEDOUT on this network
      connectionTimeout: 10000,
      auth: {
        user: "nirshuxcom@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: '"Nirshux System" <nirshuxcom@gmail.com>',
      to: "nirshuxcom@gmail.com", // Sending it to yourself as admin
      subject: `🚨 NEW ${type.toUpperCase()} REQUEST`,
      html: `
        <div style="font-family: monospace; background: #0A0A0B; color: #fff; padding: 20px; border: 1px solid #00F2C3;">
          <h2 style="color: #00F2C3;">[PROTOCOL ALERT]</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>User:</strong> ${details.email}</p>
          <p><strong>Amount:</strong> $${details.amount}</p>
          <p><strong>Asset:</strong> ${details.coin} (${details.network})</p>
          <hr style="border: 0.5px solid #333;" />
          <p style="font-size: 10px; color: #666;">Check the Admin Dashboard to approve/reject.</p>
        </div>
      `,
    });
    console.log(`📧 Admin alerted for ${type}`);
  } catch (err) {
    console.error("❌ Admin Email Alert Failed:", err.message);
  }
};

// --- 1. PROFILE ROUTE (WITH ROI CALCULATION) --- (REPLACE THE ENTIRE ROUTE)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "transactions",
        options: { sort: { date: -1 } },
      });

    if (!user) return res.status(404).json({ msg: "User profile not found" });

    // ✅ CALCULATE ROI WITH ERROR HANDLING - Don't let it block the response
    try {
      await calculateRoi(user);
    } catch (roiError) {
      console.error(
        `❌ ROI Calculation Error for ${user.email}:`,
        roiError.message,
      );
      console.error(roiError.stack);
      // Continue anyway - user still gets their data
    }

    // Reload user after ROI calculation
    const updatedUser = await User.findById(req.user.id)
      .select("-password")
      .populate({
        path: "transactions",
        options: { sort: { date: -1 } },
      });

    res.json(updatedUser);
  } catch (err) {
    console.error("❌ Profile Route Error:", err.message);
    console.error(err.stack);
    res.status(500).send("Server Error fetching profile");
  }
});

// --- 2. DEPOSIT ROUTES ---
router.get("/whitelisted-wallets", authMiddleware, async (req, res) => {
  try {
    const wallets = await Wallet.find();
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ msg: "Server Error fetching gateways" });
  }
});

// ✅ FIX: DepositModal has always POSTed the selected gateway's address as
// `addressUsed` in the request body — but this route only ever destructured
// { amount, coin, network }, so that field was silently dropped on arrival.
// The Transaction was created with addressUsed left undefined, which is why
// nothing ever showed up in Recent Transactions / the ledger / the admin
// panel. Now it's actually read off the body and stored, exactly like the
// withdrawal route already does.
router.post("/deposit-request", authMiddleware, async (req, res) => {
  try {
    const { amount, coin, network, addressUsed } = req.body;
    const user = await User.findById(req.user.id);

    const newTrx = new Transaction({
      user: req.user.id,
      type: "deposit",
      amount: Number(amount),
      coin,
      network,
      addressUsed,
      status: "pending",
    });

    const savedTrx = await newTrx.save();
    await sendAdminAlert("Deposit", {
      email: user.email,
      amount,
      coin,
      network,
    });
    user.transactions.push(savedTrx._id);
    await user.save();

    res.status(200).json({ msg: "Deposit protocol initiated." });
  } catch (err) {
    res.status(500).json({ msg: "Deposit Request Failed." });
  }
});

// --- 3. INVESTMENT ROUTE ---
router.post("/invest", authMiddleware, async (req, res) => {
  try {
    const { amount, planName, dailyRoi, durationDays } = req.body;

    if (!amount || !planName) {
      return res.status(400).json({ msg: "INVALID_INVESTMENT_DATA" });
    }

    const investor = await User.findById(req.user.id);

    // 🔒 Server-side enforcement of admin's per-user plan visibility toggle.
    // The frontend (InvestmentModal) already filters disabled plans out of
    // what's shown, but that's cosmetic only — anyone hitting this endpoint
    // directly (curl, Postman, a modified request) could otherwise still
    // invest in a plan the admin explicitly disabled for this specific user.
    if ((investor.disabledPlans || []).includes(planName)) {
      return res.status(403).json({ msg: "PLAN_NOT_AVAILABLE" });
    }

    // 🔒 PRODUCTION FIX: settle ROI on the existing portfolio and refresh
    // lastRoiCalculation to "now" BEFORE the new stake is added. This closes
    // the drift window at the source — lastRoiCalculation can never again be
    // stale by the time a new investment exists, no matter how long the user
    // was away from /profile. Wrapped in try/catch so a calc failure never
    // blocks the investment itself; the per-investment clamp in calculateRoi
    // is still there as a second line of defense regardless.
    try {
      await calculateRoi(investor);
    } catch (preInvestRoiError) {
      console.error(
        `❌ Pre-investment ROI settlement failed for ${investor.email}:`,
        preInvestRoiError.message,
      );
      console.error(preInvestRoiError.stack);
    }

    const investAmount = Number(amount);

    if (investor.balance < investAmount)
      return res.status(400).json({ msg: "Insufficient balance." });

    investor.balance -= investAmount;
    investor.totalInvested += investAmount;

    // PROMO PLAN BONUS: Only trigger $30 bonus if investing in PROMO PLAN for the first time
    if (!investor.hasMadeFirstInvestment && planName === "PROMO PLAN") {
      investor.balance += 30;
      console.log(
        `First investment bonus ($30) applied to ${investor.email} for PROMO PLAN`,
      );
    }

    // REFERRAL BONUS: Always trigger on first investment (regardless of plan)
    if (!investor.hasMadeFirstInvestment && investor.referredBy) {
      const referrer = await User.findOne({ referralId: investor.referredBy });
      if (referrer) {
        const rewardAmount = investAmount * 0.025;
        referrer.balance += rewardAmount;
        referrer.referralBalance += rewardAmount;

        const refTrx = new Transaction({
          user: referrer._id,
          type: "referral_bonus",
          amount: rewardAmount,
          status: "success",
          coin: "USD (Internal)",
          network: `Bonus from ${investor.fullName}`,
        });
        const savedRefTrx = await refTrx.save();
        referrer.transactions.push(savedRefTrx._id);

        await referrer.save();
        console.log(
          `Referral reward of ${rewardAmount} sent to ${referrer.email}`,
        );
      }
    }

    // Mark first investment as complete (regardless of which plan)
    if (!investor.hasMadeFirstInvestment) {
      investor.hasMadeFirstInvestment = true;
    }

    const endDate = new Date();
    const daysToAdd =
      durationDays === "Unlimited" ? 36500 : parseInt(durationDays);
    endDate.setDate(endDate.getDate() + daysToAdd);

    investor.activeInvestments.push({
      planName,
      amount: investAmount,
      dailyRoi,
      startDate: new Date(),
      endDate,
      lastPayout: new Date(),
      accrued: 0,
      status: "active",
    });

    const investTrx = new Transaction({
      user: investor._id,
      type: "investment",
      amount: investAmount,
      plan: planName,
      status: "success",
      coin: "USD (Internal)",
      network: "Nirshux Protocol",
    });

    const savedTrx = await investTrx.save();
    investor.transactions.push(savedTrx._id);

    await investor.save();
    res.status(200).json({
      msg: `Staked $${investAmount} successfully. Protocol rewards applied.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Investment Protocol Error." });
  }
});

// --- 4. WITHDRAWAL REQUEST ---
router.post("/withdraw-request", authMiddleware, async (req, res) => {
  try {
    const { amount, coin, network, addressUsed } = req.body;
    const user = await User.findById(req.user.id);

    if (user.balance < amount)
      return res.status(400).json({ msg: "INSUFFICIENT_FUNDS" });

    const newTrx = new Transaction({
      user: user._id,
      type: "withdrawal",
      amount,
      coin,
      network,
      addressUsed,
      status: "pending",
    });

    const savedTrx = await newTrx.save();
    await sendAdminAlert("Withdrawal", {
      email: user.email,
      amount,
      coin,
      network,
    });
    user.transactions.push(savedTrx._id);
    await user.save();

    res.json({ msg: "WITHDRAWAL_REQUEST_QUEUED" });
  } catch (err) {
    res.status(500).json({ msg: "TRANSMISSION_ERROR" });
  }
});

// --- 5. FORENSIC HISTORY ---
router.get("/history", authMiddleware, historyController.getTransactionHistory);

// --- 6. UPDATE FULL NAME ---
router.put("/update-name", authMiddleware, async (req, res) => {
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
router.post("/request-email-update", authMiddleware, async (req, res) => {
  try {
    const { oldEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (user.email !== oldEmail.trim().toLowerCase()) {
      return res.status(400).json({ msg: "IDENTIFICATION_MISMATCH" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordToken = otp;
    user.resetPasswordExpire = Date.now() + 600000;
    await user.save();

    console.log(`Email change OTP for ${oldEmail}: ${otp}`);

    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true, // ✅ FIX: matches other transports — 587 was ETIMEDOUT here
        connectionTimeout: 10000,
        auth: {
          user: "nirshuxcom@gmail.com",
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: '"Nirshux Terminal" <nirshuxcom@gmail.com>',
        to: oldEmail,
        subject: "NIRSHUX - Email Change Security Code",
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
        `,
      });

      console.log("Email change code sent successfully");
      res.json({ msg: "SECURITY_CODE_SENT_TO_OLD_EMAIL" });
    } catch (emailError) {
      console.error("Email sending error:", emailError);
      return res.status(500).json({ msg: "EMAIL_DELIVERY_FAILED" });
    }
  } catch (err) {
    console.error("Request email update error:", err);
    res.status(500).json({ msg: "TRANSMISSION_ERROR" });
  }
});

// --- 8. EMAIL CHANGE - PHASE 2: VERIFY CODE ---
router.post("/verify-update-code", authMiddleware, async (req, res) => {
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
    console.error("Verify code error:", err);
    res.status(500).json({ msg: "SERVER_ERROR" });
  }
});

// --- 9. EMAIL CHANGE - PHASE 3: FINALIZE ---
router.put("/confirm-email-update", authMiddleware, async (req, res) => {
  try {
    const { code, newEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.resetPasswordToken || user.resetPasswordToken !== code.trim()) {
      return res.status(400).json({ msg: "INVALID_OR_EXPIRED_CODE" });
    }

    if (Date.now() > user.resetPasswordExpire) {
      return res.status(400).json({ msg: "CODE_EXPIRED" });
    }

    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({ msg: "EMAIL_ALREADY_IN_USE" });
    }

    user.email = newEmail.toLowerCase();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ msg: "EMAIL_PROTOCOL_REWRITTEN" });
  } catch (err) {
    console.error("Confirm email update error:", err);
    res.status(500).json({ msg: "SERVER_SECURITY_ERROR" });
  }
});

module.exports = router;
