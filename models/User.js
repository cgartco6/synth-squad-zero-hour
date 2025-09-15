const db = require('../config/database');

class User {
  // Create a new user
  static create(userData, callback) {
    const { username, email, password, referred_by } = userData;
    const query = `
      INSERT INTO users (username, email, password, referred_by, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    db.execute(query, [username, email, password, referred_by || null], (err, results) => {
      if (err) return callback(err);
      callback(null, { id: results.insertId, username, email });
    });
  }

  // Find user by email
  static findByEmail(email, callback) {
    const query = 'SELECT * FROM users WHERE email = ?';
    db.execute(query, [email], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  // Find user by ID
  static findById(id, callback) {
    const query = 'SELECT id, username, email, tokens, created_at FROM users WHERE id = ?';
    db.execute(query, [id], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }

  // Update user tokens
  static updateTokens(userId, amount, callback) {
    const query = 'UPDATE users SET tokens = tokens + ? WHERE id = ?';
    db.execute(query, [amount, userId], (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  // Get user stats
  static getStats(userId, callback) {
    const query = `
      SELECT 
        u.username,
        u.tokens,
        COUNT(DISTINCT m.id) as missions_completed,
        COUNT(DISTINCT p.id) as payouts_requested,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_payouts
      FROM users u
      LEFT JOIN missions_completed m ON u.id = m.user_id
      LEFT JOIN payout_requests p ON u.id = p.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    
    db.execute(query, [userId], (err, results) => {
      if (err) return callback(err);
      callback(null, results[0]);
    });
  }
}

module.exports = User;
