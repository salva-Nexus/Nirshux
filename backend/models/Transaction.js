// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'investment', 'referral_bonus', 'maturity_release'], // ✅ ADDED maturity_release
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  coin: {
    type: String,
    default: 'USD'
  },
  network: {
    type: String,
    default: 'Internal'
  },
  addressUsed: {
    type: String
  },
  plan: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
