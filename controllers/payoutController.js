const PayoutRequest = require('../models/PayoutRequest');
const User = require('../models/User');
const { processPayout } = require('../utils/payoutProcessor');

// Request a payout
exports.requestPayout = async (req, res) => {
  try {
    const { amount, method, account_details } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Check user balance
    const user = await new Promise((resolve, reject) => {
      User.findById(userId, (err, user) => {
        if (err) reject(err);
        else resolve(user);
      });
    });

    if (!user || user.tokens < amount) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }

    // Create payout request
    const payoutRequest = await new Promise((resolve, reject) => {
      PayoutRequest.create({
        user_id: userId,
        amount,
        method,
        account_details
      }, (err, request) => {
        if (err) reject(err);
        else resolve(request);
      });
    });

    // Process payout (this would be async in production)
    const payoutResult = await processPayout(method, amount, account_details);

    if (payoutResult.success) {
      // Update payout request status
      await new Promise((resolve, reject) => {
        PayoutRequest.updateStatus(
          payoutRequest.id, 
          'completed', 
          payoutResult.transactionId,
          (err, request) => {
            if (err) reject(err);
            else resolve(request);
          }
        );
      });

      // Deduct tokens from user
      await new Promise((resolve, reject) => {
        User.updateTokens(userId, -amount, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ 
        success: true, 
        message: 'Payout processed successfully',
        transactionId: payoutResult.transactionId
      });
    } else {
      // Update payout request status to failed
      await new Promise((resolve, reject) => {
        PayoutRequest.updateStatus(
          payoutRequest.id, 
          'failed', 
          null,
          (err, request) => {
            if (err) reject(err);
            else resolve(request);
          }
        );
      });

      res.status(400).json({ 
        error: 'Payout failed', 
        details: payoutResult.error 
      });
    }
  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user payout history
exports.getPayoutHistory = (req, res) => {
  const userId = req.user.id;

  PayoutRequest.findByUserId(userId, (err, payouts) => {
    if (err) {
      console.error('Error fetching payout history:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json({ payouts });
  });
};

// Get all payout requests (admin only)
exports.getAllPayouts = (req, res) => {
  PayoutRequest.findAll((err, payouts) => {
    if (err) {
      console.error('Error fetching all payouts:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    res.json({ payouts });
  });
};
