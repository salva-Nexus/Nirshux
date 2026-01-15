// Wallet.js
const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
  coinName: { type: String, required: true }, // e.g., "Bitcoin"
  symbol: { type: String, required: true },   // e.g., "BTC"
  network: { type: String, required: true },  // e.g., "SegWit"
  address: { type: String, required: true },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Wallet', WalletSchema);