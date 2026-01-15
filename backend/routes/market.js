// market.js
const express = require('express');
const router = express.Router();
const { fetchTopAssets } = require('../services/priceServices');

router.get('/prices', async (req, res) => {
  const prices = await fetchTopAssets();
  if (!prices) return res.status(500).json({ message: "Error fetching market data" });
  res.json(prices);
});

module.exports = router;