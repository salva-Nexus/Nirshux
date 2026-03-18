// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// --- MIDDLEWARE ---
app.use(cors({
  origin: [
    "https://nirshux.online", 
    "https://www.nirshux.online",
    "http://localhost:3000", // Allow local testing
    /\.vercel\.app$/           // Allow all Vercel preview branches
  ],
  credentials: true
}));
app.use(express.json()); 

// Ensure DB is connected before processing any request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- ROUTES ---
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/admin', require('./routes/admin'));
app.use('/api/investor', require('./routes/investor'));
app.use('/api/market', require('./routes/market'));
app.use('/api/chat', require('./routes/chat'));

// --- DATABASE CONNECTION WITH TIMEOUT CONFIG ---
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
    });
    console.log("✅ Nirshux Database Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
  }
};

// Call it once
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
  console.log(`⚡ ROI Engine: Login-triggered calculation enabled`);
});
