const db = require('../config/database');

class PayoutRequest {
  // Create a new payout request
  static create(requestData, callback) {
    const { user_id, amount, method, account_details, status } = requestData;
    const query = `
      INSERT INTO payout_requests (user_id, amount, method, account_details, status, created_at) 
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    db.execute(query, [user_id, amount, method, account_details, status || 'pending'], (err, results) => {
      if (err) return callback(err);
      
      // Get the newly created request
      this.findById(results.insertId, callback);
    });
  }

  // Find payout request by ID
  static findById(id, callback) {
    const query = `
      SELECT pr.*, u.username, u.email 
      FROM payout_requests pr 
      JOIN users u ON pr.user_id = u.id 
      WHERE pr.id = ?
    `;
    
    db.execute(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  // Update payout request status
  static updateStatus(id, status, transaction_id = null, callback) {
    const query = `
      UPDATE payout_requests 
      SET status = ?, transaction_id = ?, processed_at = NOW() 
      WHERE id = ?
    `;
    
    db.execute(query, [status, transaction_id, id], (err, results) => {
      if (err) return callback(err);
      
      // Get the updated request
      this.findById(id, callback);
    });
  }

  // Get all payout requests for a user
  static findByUserId(userId, callback) {
    const query = `
      SELECT * FROM payout_requests 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    db.execute(query, [userId], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  // Get all payout requests (admin only)
  static findAll(callback) {
    const query = `
      SELECT pr.*, u.username, u.email 
      FROM payout_requests pr 
      JOIN users u ON pr.user_id = u.id 
      ORDER BY pr.created_at DESC
    `;
    
    db.execute(query, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
}

module.exports = PayoutRequest;
