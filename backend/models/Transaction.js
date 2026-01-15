// backend/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['deposit', 'withdrawal', 'investment', 'referral_bonus'], required: true },
  amount: { type: Number, required: true },
  coin: { type: String, required: true },
  network: { type: String, required: true },
  addressUsed: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed'], // Changed 'successful' to 'success' to match Admin logic
    default: 'pending' 
  },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', transactionSchema);