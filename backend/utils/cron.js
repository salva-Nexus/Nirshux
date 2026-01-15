// backend/utils/cron.js
const cron = require('node-cron');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const startRoiEngine = () => {
  // Runs every day at 00:00 (midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('--- 🕒 Nirshux Protocol: Daily ROI & Maturity Check ---');
    try {
      const users = await User.find({ "activeInvestments.status": "active" });

      for (let user of users) {
        let needsUpdate = false;
        let releasedToday = 0;

        for (let inv of user.activeInvestments) {
          if (inv.status !== 'active') continue;

          const now = new Date();
          const dailyProfit = inv.amount * (inv.dailyRoi / 100);

          // A. CHECK IF PLAN IS MATURED (RELEASE PROTOCOL)
          if (now >= new Date(inv.endDate)) {
            const finalProfit = (inv.accrued || 0) + dailyProfit; // Include today's profit
            const totalRelease = inv.amount + finalProfit; // Principal + All Accrued

            // MATURITY PROTOCOL:
            // 1. Send Principal + Accrued to Total Deposited (withdrawable balance)
            user.balance += totalRelease;
            
            // 2. Record ONLY the profit in totalEarned (invariant - never decreases)
            user.totalEarned += finalProfit;
            
            // 3. totalInvested remains unchanged (it's a lifetime record - invariant)
            
            // 4. Mark plan as completed (will be removed from array)
            inv.status = 'completed';
            releasedToday += totalRelease;

            // 5. Log the Release in Transactions
            const releaseTrx = new Transaction({
              user: user._id,
              type: 'maturity_release',
              amount: totalRelease,
              coin: `USD (${inv.planName} Matured)`,
              network: 'Nirshux Protocol',
              status: 'success'
            });
            await releaseTrx.save();
            user.transactions.push(releaseTrx._id);
            
            needsUpdate = true;
            console.log(`💰 ${user.email}: ${inv.planName} matured → Released $${totalRelease.toFixed(2)} (Principal: $${inv.amount}, Profit: $${finalProfit.toFixed(2)})`);
          } 
          
          // B. DAILY ROI ACCRUAL (STAY IN THE CARD)
          else {
            // Add today's profit to the card's internal accrued bucket
            inv.accrued = (inv.accrued || 0) + dailyProfit;
            inv.lastPayout = Date.now();
            needsUpdate = true;
            console.log(`📈 ${user.email}: ${inv.planName} → Daily ROI +$${dailyProfit.toFixed(2)} (Total Accrued: $${inv.accrued.toFixed(2)})`);
          }
        }

        if (needsUpdate) {
          // Delete completed plan cards from activeInvestments array
          user.activeInvestments = user.activeInvestments.filter(inv => inv.status === 'active');
          await user.save();
          
          if (releasedToday > 0) {
            console.log(`✅ ${user.email}: Maturity Protocol Complete → Sent $${releasedToday.toFixed(2)} to Total Deposited`);
          }
        }
      }
      
      console.log(`✅ ROI Engine Complete: Processed ${users.length} active portfolios.`);
    } catch (err) {
      console.error("❌ ROI Engine Error:", err.message);
    }
  });

  console.log('⚡ Nirshux ROI Engine initialized. Next run: Daily at 00:00');
};

module.exports = startRoiEngine;