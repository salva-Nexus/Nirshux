// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    plainPassword: { type: String, default: "" }, // blank for existing users, populated for new

    role: { type: String, enum: ["user", "admin"], default: "user" },

    referralId: { type: String, unique: true },
    referredBy: { type: String, default: null },

    balance: { type: Number, default: 0 },
    referralBalance: { type: Number, default: 0 },
    totalInvested: { type: Number, default: 0 },
    totalEarned: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 },

    disabledPlans: { type: [String], default: [] },

    isVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },

    hasMadeFirstInvestment: { type: Boolean, default: false },

    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },

    lastRoiCalculation: { type: Date, default: Date.now },

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    activeInvestments: [
      {
        planName: String,
        amount: Number,
        dailyRoi: Number,
        startDate: { type: Date, default: Date.now },
        endDate: Date,
        lastPayout: { type: Date, default: Date.now },
        accrued: { type: Number, default: 0 },
        status: { type: String, default: "active" },
        pausedAt: { type: Date, default: null },
        totalPausedMs: { type: Number, default: 0 },
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

module.exports = mongoose.model('User', userSchema);
