const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const { authenticateSocket } = require('./middleware/socketAuth');
const { handleMessage } = require('./controllers/messageController');
const { PriorityQueue } = require('./utils/priorityQueue');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Message priority queue
const messageQueue = new PriorityQueue();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/encrypted-chat')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Socket.io middleware for authentication
io.use(authenticateSocket);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);

  // Join user to their own room for private messages
  socket.join(socket.userId);

  // Listen for new messages
  socket.on('message', async (data) => {
    try {
      // Queue the message with priority
      messageQueue.enqueue({
        ...data,
        senderId: socket.userId, 
        timestamp: new Date()
      }, data.priority || 0);

      // Process messages from the queue
      while (!messageQueue.isEmpty()) {
        const message = messageQueue.dequeue();
        
        // Save message to database and emit to recipients
        await handleMessage(io, message);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 