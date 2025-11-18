const Message = require('../models/Message');
const User = require('../models/User');
const debug = require('debug')('collab-sphere:messages');

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const senderId = req.user._id; // Assuming user is attached to req by auth middleware
    
    // Check if both users exist
    const [sender, recipient] = await Promise.all([
      User.findById(senderId),
      User.findById(recipientId)
    ]);
    
    if (!sender || !recipient) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if student is messaging alumni or vice versa
    const validInteraction = 
      (sender.role === 'student' && recipient.role === 'alumni') ||
      (sender.role === 'alumni' && recipient.role === 'student');
    
    if (!validInteraction) {
      return res.status(403).json({ error: 'Invalid message interaction. Students can only message alumni and vice versa.' });
    }
    
    // Create and save the message
    const newMessage = new Message({
      sender: senderId,
      recipient: recipientId,
      text,
      read: false
    });
    
    await newMessage.save();
    
    // Return the saved message with sender details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName role profilePhoto')
      .populate('recipient', 'firstName lastName role profilePhoto');
    
    // Get Socket.IO instance
    const io = req.app.get('io');
    
    // Emit message to recipient
    if (io) {
      io.to(recipientId.toString()).emit('newMessage', {
        message: populatedMessage,
        sender: {
          _id: sender._id,
          firstName: sender.firstName,
          lastName: sender.lastName,
          profilePhoto: sender.profilePhoto
        }
      });
    }
    
    res.status(201).json(populatedMessage);
  } catch (err) {
    console.error('Send Message Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get conversation between two users
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user._id; // Authenticated user
    const { otherUserId } = req.params;
    
    // Find messages where either user is sender and the other is recipient
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
      .populate('sender', 'firstName lastName role')
      .populate('recipient', 'firstName lastName role')
      .sort({ createdAt: 1 });
    
    // Mark messages as read where the other user is the sender and messages are unread
    await Message.updateMany(
      { sender: otherUserId, recipient: userId, read: false },
      { read: true }
    );
    
    res.status(200).json(messages);
  } catch (err) {
    console.error('Get Conversation Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get list of all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all messages where the user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    })
      .populate('sender', 'firstName lastName role')
      .populate('recipient', 'firstName lastName role')
      .sort({ createdAt: -1 });
    
    // Extract unique conversation partners
    const conversations = {};
    
    messages.forEach(message => {
      // Determine the conversation partner (the other user)
      const partnerId = message.sender._id.toString() === userId.toString() 
        ? message.recipient._id.toString() 
        : message.sender._id.toString();
      
      // If this is the first message we're seeing with this partner, add them to conversations
      if (!conversations[partnerId]) {
        const partner = message.sender._id.toString() === userId.toString() 
          ? message.recipient 
          : message.sender;
        
        conversations[partnerId] = {
          user: partner,
          lastMessage: message,
          unreadCount: message.sender._id.toString() !== userId.toString() && !message.read ? 1 : 0
        };
      } else if (message.sender._id.toString() !== userId.toString() && !message.read) {
        // If this message is from the partner and unread, increment unread count
        conversations[partnerId].unreadCount += 1;
      }
    });
    
    // Convert to array and sort by most recent message
    const sortedConversations = Object.values(conversations).sort((a, b) => 
      b.lastMessage.createdAt - a.lastMessage.createdAt
    );
    
    res.status(200).json(sortedConversations);
  } catch (err) {
    console.error('Get Conversations Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get users that can be messaged (all students and alumni except the current user)
exports.getMessagingUsers = async (req, res) => {
  try {
    debug('Getting messaging users for user ID:', req.user?._id);

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      debug('No authenticated user found');
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to view messaging users'
      });
    }

    const userId = req.user._id;
    debug('Finding current user with ID:', userId);
    
    const currentUser = await User.findById(userId);

    if (!currentUser) {
      debug('Current user not found in database');
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Your user account could not be found'
      });
    }

    debug('Current user role:', currentUser.role);

    // If student, get all alumni. If alumni, get all students
    const targetRole = currentUser.role === 'student' ? 'alumni' : 'student';
    debug('Searching for users with role:', targetRole);
    
    const users = await User.find({ 
      _id: { $ne: userId },
      role: targetRole,
      // Ensure user account is active
      isActive: { $ne: false }
    })
    .select('firstName lastName email batch department role profilePhoto isActive')
    .sort('firstName lastName')
    .lean(); // Use lean() for better performance

    debug(`Found ${users?.length || 0} ${targetRole} users`);

    if (!users || users.length === 0) {
      return res.status(200).json({ 
        users: [],
        message: `No ${targetRole} users found`
      });
    }

    res.status(200).json(users);
  } catch (err) {
    debug('Error in getMessagingUsers:', err);
    console.error('Get Messaging Users Error:', err);
    res.status(500).json({ 
      error: 'Server error',
      message: 'Failed to load users. Please try again later.'
    });
  }
};
