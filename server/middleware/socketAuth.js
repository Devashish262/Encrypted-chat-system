const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate socket connections
exports.authenticateSocket = async (socket, next) => {
  try {
    // Get token from handshake auth
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    
    // Add user id to socket
    socket.userId = decoded.id;
    
    // Update user status to online
    await User.findByIdAndUpdate(decoded.id, { status: 'online' });
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
}; 