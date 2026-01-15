// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const startRoiEngine = require('./utils/cron');

const app = express();

// --- MIDDLEWARE ---
app.use(cors()); 
app.use(express.json()); 

// --- INITIALIZE CRON ENGINE ---
startRoiEngine(); 

// --- ROUTES ---
// This line below already tells the server to use everything inside auth.js
app.use('/api/auth', require('./routes/auth')); 
app.use('/api/admin', require('./routes/admin'));
app.use('/api/investor', require('./routes/investor'));
app.use('/api/market', require('./routes/market'));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Nirshux Database Connected Successfully"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// DELETE THE ROUTER.POST BLOCK THAT WAS HERE - IT IS NOW IN AUTH.JS

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is flying on port ${PORT}`);
});