const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Find user by id and check profile completeness
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check for incomplete profile
    if (!user.firstName || !user.lastName || !user.role) {
      return res.status(403).json({
        error: 'Incomplete profile',
        message: 'Please complete your profile before continuing',
        redirectTo: '/complete-profile',
        userId: user._id
      });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
};
