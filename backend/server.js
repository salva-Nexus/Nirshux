// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARE ---
// --- MIDDLEWARE ---
app.use(cors({
  origin: ["https://nirshux.online", "https://www.nirshux.online"],
  credentials: true
}));
app.use(express.json()); 

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/admin', require('./routes/admin'));
app.use('/api/investor', require('./routes/investor'));
app.use('/api/market', require('./routes/market'));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Nirshux Database Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
  console.log(`⚡ ROI Engine: Login-triggered calculation enabled`);
});