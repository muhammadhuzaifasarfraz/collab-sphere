const jwt = require('jsonwebtoken');
const User = require('../models/User');

function socketAuthMiddleware(socket, next) {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error: Invalid token'));
      }

      try {
        const user = await User.findById(decoded.userId);
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        // Attach user data to socket
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket auth error:', error);
        next(new Error('Authentication error: Server error'));
      }
    });
  } catch (error) {
    console.error('Socket middleware error:', error);
    next(new Error('Internal server error'));
  }
}

module.exports = socketAuthMiddleware;
