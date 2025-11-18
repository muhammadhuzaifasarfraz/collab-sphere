const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();
const socketAuthMiddleware = require('./middleware/socketAuthMiddleware');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  cookie: false,
  path: '/socket.io/',
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure static file serving
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join a user to their own room for private messaging
  socket.on('join', (userId) => {
    if (!userId) {
      socket.emit('error', { message: 'Invalid user ID' });
      return;
    }
    console.log(`User ${userId} joined room ${userId}`);
    socket.join(userId.toString());

    // Leave previous rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    // Join new room
    socket.join(userId.toString());
    console.log(`User ${userId} joined room: ${userId}`);
  });
  
  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const { recipientId, message } = data;
      if (!recipientId || !message) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Emit to recipient's room
      io.to(recipientId.toString()).emit('newMessage', {
        message,
        sender: message.sender
      });

    } catch (error) {
      console.error('Socket message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle message read receipts
  socket.on('markAsRead', (data) => {
    const { senderId } = data;
    if (!senderId) return;

    io.to(senderId.toString()).emit('messageRead', {
      readBy: socket.userId,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Make io accessible in other modules
app.set('io', io);

// Apply socket authentication middleware
io.use(socketAuthMiddleware);

// Import & Use Routes
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', messageRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.error("❌ MongoDB Connection Error:", err));

// Server Port
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('🚀 API is running'));

server.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
