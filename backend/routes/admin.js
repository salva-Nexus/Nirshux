// backend/routes/admin.js
const router = require("express").Router();
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const authMiddleware = require("../middleware/auth");

const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "admin")
      return res.status(403).json({ msg: "UNAUTHORIZED_ACCESS" });
    next();
  } catch (err) {
    res.status(500).json({ msg: "SECURITY_ERROR" });
  }
};

const nodemailer = require("nodemailer");

const adminMailer = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // ✅ FIX: matches other transports — 587 was ETIMEDOUT here
  connectionTimeout: 10000,
  auth: { user: "nirshuxcom@gmail.com", pass: process.env.GMAIL_APP_PASSWORD },
});

const sendTransactionEmail = async (
  toEmail,
  userName,
  type,
  amount,
  coin,
  status,
) => {
  const isApproved = status === "approved";
  const isDeposit = type === "deposit";

  const accentColor = "#00F2C3";
  const statusColor = isApproved ? "#00F2C3" : "#EF4444";
  const statusLabel = isApproved ? "APPROVED" : "REJECTED";
  const statusIcon = isApproved ? "✅" : "❌";

  const subject = isApproved
    ? `${statusIcon} Your ${isDeposit ? "Deposit" : "Withdrawal"} Has Been Approved — Nirshux`
    : `${statusIcon} Your ${isDeposit ? "Deposit" : "Withdrawal"} Was Not Approved — Nirshux`;

  const bodyMessage = isDeposit
    ? isApproved
      ? `Your deposit of <strong>$${Number(amount).toLocaleString()} ${coin}</strong> has been verified and credited to your account. Your balance has been updated.`
      : `Your deposit of <strong>$${Number(amount).toLocaleString()} ${coin}</strong> could not be verified and has been rejected. If you believe this is an error, please contact support.`
    : isApproved
      ? `Your withdrawal request of <strong>$${Number(amount).toLocaleString()} ${coin}</strong> has been approved and is being processed. Funds will arrive at your destination address shortly.`
      : `Your withdrawal request of <strong>$${Number(amount).toLocaleString()} ${coin}</strong> was rejected. If you believe this is an error, please contact support. Your balance has not been affected.`;

  const html = `
    <div style="font-family: 'Courier New', monospace; background: #0A0A0A; color: #fff; padding: 0; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; padding: 48px 32px;">
 
        <!-- Header -->
        <div style="margin-bottom: 32px;">
          <h1 style="color: ${accentColor}; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; margin: 0 0 4px 0;">NIRSHUX</h1>
          <p style="color: #444; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Transaction Notification System</p>
        </div>
 
        <!-- Status Banner -->
        <div style="background: ${isApproved ? "rgba(0,242,195,0.05)" : "rgba(239,68,68,0.05)"}; border: 1px solid ${statusColor}30; border-left: 3px solid ${statusColor}; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="color: ${statusColor}; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; font-weight: 900; margin: 0 0 6px 0;">${statusIcon} ${statusLabel}</p>
          <p style="color: #ccc; font-size: 13px; margin: 0; line-height: 1.6;">${bodyMessage}</p>
        </div>
 
        <!-- Transaction Details -->
        <div style="background: #111; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
          <p style="color: #444; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; font-weight: 900;">Transaction Details</p>
 
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 0; border-bottom: 1px solid #1a1a1a;">Type</td>
              <td style="color: #fff; font-size: 11px; font-weight: 900; text-align: right; padding: 8px 0; border-bottom: 1px solid #1a1a1a; text-transform: uppercase;">${type}</td>
            </tr>
            <tr>
              <td style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 0; border-bottom: 1px solid #1a1a1a;">Amount</td>
              <td style="color: ${accentColor}; font-size: 18px; font-weight: 900; text-align: right; padding: 8px 0; border-bottom: 1px solid #1a1a1a;">$${Number(amount).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 0; border-bottom: 1px solid #1a1a1a;">Asset</td>
              <td style="color: #fff; font-size: 11px; font-weight: 900; text-align: right; padding: 8px 0; border-bottom: 1px solid #1a1a1a;">${coin}</td>
            </tr>
            <tr>
              <td style="color: #555; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; padding: 8px 0;">Status</td>
              <td style="color: ${statusColor}; font-size: 11px; font-weight: 900; text-align: right; padding: 8px 0; text-transform: uppercase;">${statusLabel}</td>
            </tr>
          </table>
        </div>
 
        <!-- Greeting -->
        <p style="color: #444; font-size: 11px; margin: 0 0 4px 0;">Hi, <span style="color: #888;">${userName}</span></p>
        <p style="color: #333; font-size: 10px; margin: 0 0 32px 0;">If you have any questions, reply to this email or contact our support team.</p>
 
        <!-- Footer -->
        <div style="border-top: 1px solid #1a1a1a; padding-top: 20px;">
          <p style="color: #2a2a2a; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; margin: 0;">© Nirshux Terminal // Automated Notification</p>
          <p style="color: #222; font-size: 9px; margin: 4px 0 0 0;">Do not reply to automated system messages.</p>
        </div>
 
      </div>
    </div>
  `;

  await adminMailer.sendMail({
    from: '"Nirshux Terminal" <nirshuxcom@gmail.com>',
    to: toEmail,
    subject,
    html,
  });
};

// --- USER OPERATIONS ---

// GET all users — explicitly select plainPassword so the admin panel can display it
router.get("/users", [authMiddleware, adminOnly], async (req, res) => {
  try {
    // select('-password') removes the bcrypt hash but KEEPS plainPassword (different field)
    // Being explicit here to make it obvious and avoid future confusion
    const users = await User.find()
      .select("-password") // strips hashed password only; plainPassword is a separate field
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: "REGISTRY_SYNC_FAILED" });
  }
});

// GET SINGLE USER (for the Admin → individual user view page)
router.get("/user/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate({ path: "transactions", options: { sort: { date: -1 } } });
    if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "FETCH_FAILED" });
  }
});

router.delete("/user/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    if (req.params.id === req.user.id)
      return res.status(400).json({ msg: "SELF_TERMINATION_DENIED" });
    await Transaction.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "SUBJECT_PURGED" });
  } catch (err) {
    res.status(500).json({ msg: "PURGE_FAILED" });
  }
});

// @route   PUT api/admin/user/adjust-balance/:id
// @desc    Manually increase/decrease user balance (used by the quick-mutate
//   card on the main Admin Panel dashboard — delta-based, +/- buttons).
//   - INCREASE: treated as a real deposit — a Transaction record is created
//     (type: 'deposit', status: 'success') so it shows up in the user's
//     transaction history exactly like a normal approved deposit, and the
//     user is emailed a deposit-style notification ("$X has been deposited
//     into your account"). No mention of admin action anywhere.
//   - DECREASE: silent. No transaction record, no email, no notification
//     of any kind to the user.
router.put(
  "/user/adjust-balance/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount, sendEmail } = req.body;
      if (isNaN(amount)) return res.status(400).json({ msg: "INVALID_AMOUNT" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

      const delta = Number(amount);
      user.balance += delta;
      if (user.balance < 0) user.balance = 0;

      await user.save();

      // ── Increase → real deposit record, ALWAYS. Email only if admin opted in. ──
      if (delta > 0) {
        try {
          const trx = new Transaction({
            user: user._id,
            type: "deposit",
            amount: delta,
            coin: "USD",
            network: "Internal",
            status: "success",
          });
          await trx.save();

          user.transactions.push(trx._id);
          user.totalDeposited = (user.totalDeposited || 0) + delta;
          await user.save();

          // Email is opt-in per action — checkbox defaults unchecked on the
          // admin panel, so most increases stay silent unless explicitly
          // requested. Transaction history above is recorded regardless.
          if (sendEmail === true) {
            sendTransactionEmail(
              user.email,
              user.fullName,
              "deposit",
              delta,
              "USD",
              "approved",
            ).catch((err) =>
              console.error(
                "📧 Balance-increase deposit email failed:",
                err.message,
              ),
            );
          }
        } catch (recordErr) {
          console.error(
            "⚠️ Failed to record deposit for balance increase:",
            recordErr.message,
          );
        }
      }
      // ── Decrease → nothing further. No record, no email, regardless of sendEmail. ──

      res.json({ msg: "LIQUIDITY_ADJUSTED", newBalance: user.balance });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// @route   PUT api/admin/user/set-balance/:id
// @desc    Used by the individual User View page (AdminUserView). Admin enters
//   the EXACT balance the user should end up with (not a +/- delta). The
//   direction is derived server-side and is always recorded as a real
//   transaction, both ways:
//     - newBalance > oldBalance  → recorded as a DEPOSIT of (new - old)
//     - newBalance < oldBalance  → recorded as a WITHDRAWAL of (old - new)
//     - newBalance === oldBalance → no-op, no transaction
//   totalDeposited / withdrawn stat counters are kept in sync with whichever
//   direction fired. Frontend is expected to show a confirmation card first
//   ("This will record as a DEPOSIT/WITHDRAWAL of $X") — this endpoint itself
//   just trusts the final confirmed amount and does the honest bookkeeping.
router.put(
  "/user/set-balance/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount, sendEmail, recordInHistory } = req.body;
      if (amount === undefined || amount === "" || isNaN(amount))
        return res.status(400).json({ msg: "INVALID_AMOUNT" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

      const newBalance = Number(amount);
      const oldBalance = user.balance || 0;
      const delta = newBalance - oldBalance;
      // Defaults true so any other caller that omits this field keeps old behavior.
      const shouldRecord = recordInHistory !== false;

      user.balance = newBalance;

      let recordedType = null;
      let recordedAmount = 0;

      if (delta > 0 && shouldRecord) {
        recordedType = "deposit";
        recordedAmount = delta;
        user.totalDeposited = (user.totalDeposited || 0) + delta;

        const trx = new Transaction({
          user: user._id,
          type: "deposit",
          amount: delta,
          coin: "USD",
          network: "Admin Adjustment",
          status: "success",
        });
        await trx.save();
        user.transactions.push(trx._id);
      } else if (delta < 0 && shouldRecord) {
        recordedType = "withdrawal";
        recordedAmount = Math.abs(delta);
        user.withdrawn = (user.withdrawn || 0) + Math.abs(delta);

        const trx = new Transaction({
          user: user._id,
          type: "withdrawal",
          amount: Math.abs(delta),
          coin: "USD",
          network: "Admin Adjustment",
          status: "success",
        });
        await trx.save();
        user.transactions.push(trx._id);
      }
      // delta !== 0 but shouldRecord === false → balance still changes above,
      // but no Transaction, no totalDeposited/withdrawn bump. Silent correction.

      await user.save();

      if (recordedType && sendEmail === true) {
        sendTransactionEmail(
          user.email,
          user.fullName,
          recordedType,
          recordedAmount,
          "USD",
          "approved",
        ).catch((err) =>
          console.error(
            `📧 Balance set (${recordedType}) email failed:`,
            err.message,
          ),
        );
      }

      res.json({
        msg: "BALANCE_SET",
        newBalance: user.balance,
        recordedAs: recordedType, // "deposit" | "withdrawal" | null
        recordedAmount,
      });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// @route   PUT api/admin/user/adjust-total-earned/:id
// @desc    Manually adjust user's total earned stat
router.put(
  "/user/adjust-total-earned/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount)) return res.status(400).json({ msg: "INVALID_AMOUNT" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

      user.totalEarned += Number(amount);
      if (user.totalEarned < 0) user.totalEarned = 0;

      await user.save();
      res.json({
        msg: "TOTAL_EARNED_ADJUSTED",
        newTotalEarned: user.totalEarned,
      });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// @desc    Manually adjust user's total invested stat
router.put(
  "/user/adjust-total-invested/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount)) return res.status(400).json({ msg: "INVALID_AMOUNT" });

      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });

      user.totalInvested += Number(amount);
      if (user.totalInvested < 0) user.totalInvested = 0;

      await user.save();
      res.json({
        msg: "TOTAL_INVESTED_ADJUSTED",
        newTotalInvested: user.totalInvested,
      });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// SET TOTAL EARNED (direct assignment — used on the User View page's stat cards)
router.put(
  "/user/set-total-earned/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount) || amount === undefined)
        return res.status(400).json({ msg: "INVALID_AMOUNT" });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      user.totalEarned = Number(amount);
      await user.save();
      res.json({ msg: "TOTAL_EARNED_SET", newTotalEarned: user.totalEarned });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// SET TOTAL INVESTED (direct assignment — used on the User View page's stat cards)
router.put(
  "/user/set-total-invested/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount) || amount === undefined)
        return res.status(400).json({ msg: "INVALID_AMOUNT" });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      user.totalInvested = Number(amount);
      await user.save();
      res.json({
        msg: "TOTAL_INVESTED_SET",
        newTotalInvested: user.totalInvested,
      });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// SET TOTAL WITHDRAWN (direct assignment)
router.put(
  "/user/set-withdrawn/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount) || amount === undefined)
        return res.status(400).json({ msg: "INVALID_AMOUNT" });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      user.withdrawn = Number(amount);
      await user.save();
      res.json({ msg: "WITHDRAWN_SET", newWithdrawn: user.withdrawn });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// SET TOTAL DEPOSITED (direct assignment)
router.put(
  "/user/set-total-deposited/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { amount } = req.body;
      if (isNaN(amount) || amount === undefined)
        return res.status(400).json({ msg: "INVALID_AMOUNT" });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      user.totalDeposited = Number(amount);
      await user.save();
      res.json({
        msg: "TOTAL_DEPOSITED_SET",
        newTotalDeposited: user.totalDeposited,
      });
    } catch (err) {
      res.status(500).json({ msg: "MUTATION_FAILED" });
    }
  },
);

// PAUSE ACTIVE INVESTMENT
router.put(
  "/user/:userId/investment/:investmentId/pause",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      const inv = user.activeInvestments.id(req.params.investmentId);
      if (!inv) return res.status(404).json({ msg: "INVESTMENT_NOT_FOUND" });
      if (inv.status !== "active")
        return res.status(400).json({ msg: "NOT_ACTIVE" });
      inv.status = "paused";
      inv.pausedAt = new Date();
      await user.save();
      res.json({ msg: "INVESTMENT_PAUSED" });
    } catch (err) {
      res.status(500).json({ msg: "PAUSE_FAILED" });
    }
  },
);

// RESUME ACTIVE INVESTMENT
router.put(
  "/user/:userId/investment/:investmentId/resume",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      const inv = user.activeInvestments.id(req.params.investmentId);
      if (!inv) return res.status(404).json({ msg: "INVESTMENT_NOT_FOUND" });
      if (inv.status !== "paused")
        return res.status(400).json({ msg: "NOT_PAUSED" });
      // Accumulate total paused duration so ROI engine can skip it
      const pausedDuration = new Date() - new Date(inv.pausedAt);
      inv.totalPausedMs = (inv.totalPausedMs || 0) + pausedDuration;
      inv.status = "active";
      inv.pausedAt = null;
      // Push lastPayout forward by the paused duration so ROI doesn't backfill
      inv.lastPayout = new Date(
        new Date(inv.lastPayout).getTime() + pausedDuration,
      );
      await user.save();
      res.json({ msg: "INVESTMENT_RESUMED" });
    } catch (err) {
      res.status(500).json({ msg: "RESUME_FAILED" });
    }
  },
);

// TOGGLE PLAN VISIBILITY FOR USER
router.put(
  "/user/:id/toggle-plan",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const { planName } = req.body;
      if (!planName) return res.status(400).json({ msg: "PLAN_NAME_REQUIRED" });
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ msg: "SUBJECT_NOT_FOUND" });
      if (!Array.isArray(user.disabledPlans)) user.disabledPlans = [];
      const idx = user.disabledPlans.indexOf(planName);
      if (idx === -1) {
        user.disabledPlans.push(planName); // disable it
      } else {
        user.disabledPlans.splice(idx, 1); // re-enable it
      }
      await user.save();
      res.json({
        msg: "PLAN_VISIBILITY_TOGGLED",
        disabledPlans: user.disabledPlans,
      });
    } catch (err) {
      res.status(500).json({ msg: "TOGGLE_FAILED" });
    }
  },
);

// --- DEPOSIT OPERATIONS ---

// GET ALL PENDING DEPOSITS
router.get(
  "/pending-deposits",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const pending = await Transaction.find({
        type: "deposit",
        status: "pending",
      })
        .populate("user", "fullName email")
        .sort({ createdAt: -1 });
      res.json(pending);
    } catch (err) {
      res.status(500).json({ msg: "DEPOSIT_FETCH_FAILED" });
    }
  },
);

// @route   PUT api/admin/deposit/approve/:id
router.put(
  "/deposit/approve/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const trx = await Transaction.findById(req.params.id);
      if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });
      if (trx.status !== "pending")
        return res.status(400).json({ msg: "ALREADY_PROCESSED" });

      const user = await User.findById(trx.user);
      if (!user) return res.status(404).json({ msg: "USER_NOT_FOUND" });

      user.balance += trx.amount;
      user.totalDeposited = (user.totalDeposited || 0) + trx.amount;
      trx.status = "success";

      await user.save();
      await trx.save();

      // Fire email — non-blocking, don't fail the request if email fails
      sendTransactionEmail(
        user.email,
        user.fullName,
        "deposit",
        trx.amount,
        trx.coin || "USD",
        "approved",
      ).catch((err) =>
        console.error("📧 Deposit approval email failed:", err.message),
      );

      res.json({ msg: "FUNDS_AUTHORIZED_SUCCESSFULLY" });
    } catch (err) {
      res.status(500).json({ msg: "APPROVAL_FAILED" });
    }
  },
);

// @route   PUT api/admin/deposit/reject/:id
router.put(
  "/deposit/reject/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const trx = await Transaction.findById(req.params.id);
      if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });

      const user = await User.findById(trx.user);

      trx.status = "failed";
      await trx.save();

      if (user) {
        sendTransactionEmail(
          user.email,
          user.fullName,
          "deposit",
          trx.amount,
          trx.coin || "USD",
          "rejected",
        ).catch((err) =>
          console.error("📧 Deposit rejection email failed:", err.message),
        );
      }

      res.json({ msg: "DEPOSIT_REJECTED" });
    } catch (err) {
      res.status(500).json({ msg: "REJECTION_FAILED" });
    }
  },
);

// --- WITHDRAWAL OPERATIONS ---

// GET ALL PENDING WITHDRAWALS
router.get(
  "/pending-withdrawals",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const pending = await Transaction.find({
        type: "withdrawal",
        status: "pending",
      })
        .populate("user", "fullName email")
        .sort({ createdAt: -1 });
      res.json(pending);
    } catch (err) {
      res.status(500).json({ msg: "WITHDRAWAL_FETCH_FAILED" });
    }
  },
);

// @route   PUT api/admin/withdrawal/approve/:id
router.put(
  "/withdrawal/approve/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const trx = await Transaction.findById(req.params.id);
      if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });
      if (trx.status !== "pending")
        return res.status(400).json({ msg: "ALREADY_PROCESSED" });

      const user = await User.findById(trx.user);
      if (!user) return res.status(404).json({ msg: "USER_NOT_FOUND" });

      if (user.balance < trx.amount) {
        trx.status = "failed";
        await trx.save();
        return res.status(400).json({ msg: "INSUFFICIENT_USER_BALANCE" });
      }

      user.balance -= trx.amount;
      user.withdrawn = (user.withdrawn || 0) + trx.amount;
      trx.status = "success";

      await user.save();
      await trx.save();

      sendTransactionEmail(
        user.email,
        user.fullName,
        "withdrawal",
        trx.amount,
        trx.coin || "USD",
        "approved",
      ).catch((err) =>
        console.error("📧 Withdrawal approval email failed:", err.message),
      );

      res.json({ msg: "WITHDRAWAL_EXECUTED_SUCCESSFULLY" });
    } catch (err) {
      res.status(500).json({ msg: "WITHDRAWAL_APPROVAL_FAILED" });
    }
  },
);

// @route   PUT api/admin/withdrawal/reject/:id
router.put(
  "/withdrawal/reject/:id",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const trx = await Transaction.findById(req.params.id);
      if (!trx) return res.status(404).json({ msg: "TRANSACTION_NOT_FOUND" });

      const user = await User.findById(trx.user);

      trx.status = "failed";
      await trx.save();

      if (user) {
        sendTransactionEmail(
          user.email,
          user.fullName,
          "withdrawal",
          trx.amount,
          trx.coin || "USD",
          "rejected",
        ).catch((err) =>
          console.error("📧 Withdrawal rejection email failed:", err.message),
        );
      }

      res.json({ msg: "WITHDRAWAL_REJECTED" });
    } catch (err) {
      res.status(500).json({ msg: "REJECTION_FAILED" });
    }
  },
);

// --- WALLET / ASSET OPERATIONS ---

router.get("/wallets", [authMiddleware, adminOnly], async (req, res) => {
  try {
    const wallets = await Wallet.find().sort({ createdAt: -1 });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ msg: "ASSET_FETCH_FAILED" });
  }
});

router.post(
  "/whitelist-wallet",
  [authMiddleware, adminOnly],
  async (req, res) => {
    try {
      const newWallet = new Wallet(req.body);
      await newWallet.save();
      res.json({ msg: "ASSET_AUTHORIZED" });
    } catch (err) {
      res.status(500).json({ msg: "AUTHORIZATION_FAILED" });
    }
  },
);

router.delete("/wallet/:id", [authMiddleware, adminOnly], async (req, res) => {
  try {
    await Wallet.findByIdAndDelete(req.params.id);
    res.json({ msg: "ASSET_DE_LISTED" });
  } catch (err) {
    res.status(500).json({ msg: "REVOCATION_FAILED" });
  }
});

module.exports = router;
