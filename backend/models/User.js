// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  referralId: { type: String, unique: true }, 
  referredBy: { type: String, default: null }, 
  
  balance: { type: Number, default: 0 },
  referralBalance: { type: Number, default: 0 },
  totalInvested: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 }, 
  withdrawn: { type: Number, default: 0 }, 
  
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  // --- NEW: FIRST INVESTMENT TRACKER ---
  hasMadeFirstInvestment: { type: Boolean, default: false },

  // --- PASSWORD RESET FIELDS ---
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  // --- REAL ARRAY FOR TRANSACTIONS ---
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }],

  activeInvestments: [{
    planName: String,
    amount: Number,
    dailyRoi: Number,
    startDate: { type: Date, default: Date.now },
    endDate: Date, 
    lastPayout: { type: Date, default: Date.now },
    status: { type: String, default: 'active' } 
  }]
}, { 
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

module.exports = mongoose.model('User', userSchema);