const axios = require('axios');

const fetchTopAssets = async () => {
  try {
    const coins = [
      'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple', 
      'cardano', 'dogecoin', 'polkadot', 'tron', 'chainlink', 
      'polygon', 'litecoin', 'bitcoin-cash', 'stellar', 'cosmos', 
      'uniswap', 'near', 'ethereum-classic', 'monero', 'avalanche-2'
    ].join(',');

    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`
    );
    
    return response.data;
  } catch (error) {
    console.error("CoinGecko Error:", error.message);
    return null;
  }
};

module.exports = { fetchTopAssets };