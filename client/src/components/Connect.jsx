import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMessagingUsers, getConversation, sendMessage as apiSendMessage, getFullImageUrl } from '../services/api';
import { io } from 'socket.io-client';
import '../styles/connect.css';

const SOCKET_URL = 'http://localhost:5000';

// Function to get user's initials
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

const Connect = ({ currentUser: initialUser }) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [socket, setSocket] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const userRef = useRef(initialUser);
  const socketRef = useRef(null);

  // Setup authentication status
  const isAuthenticated = Boolean(userRef.current?.id || userRef.current?._id);

  // Emoji list for the emoji picker
  const emojis = ['😊', '😂', '😍', '👍', '👋', '🎓', '💼', '🚀', '✨', '💡', '📚', '👏', '🙌', '🤝', '💬'];

  // Handle new message
  const handleNewMessage = useCallback((newMsg, sender) => {
    const currentUserId = userRef.current?._id;
    if (!currentUserId) return;

    setConversations(prev => {
      const userId = sender._id;
      const formattedMsg = {
        sender: sender._id === currentUserId ? 'current' : sender._id,
        text: newMsg.text,
        timestamp: new Date(newMsg.createdAt),
        read: newMsg.read
      };

      return {
        ...prev,
        [userId]: [...(prev[userId] || []), formattedMsg]
      };
    });

    if (sender._id !== currentUserId) {
      setUnreadCounts(prev => ({
        ...prev,
        [sender._id]: (prev[sender._id] || 0) + 1
      }));
    }
  }, []); // No dependencies needed since we're using ref

  // Handle message read receipts
  const handleMessageRead = useCallback((senderId) => {
    setConversations(prev => {
      if (!prev[senderId]) return prev;
      
      return {
        ...prev,
        [senderId]: prev[senderId].map(msg => 
          msg.sender === 'current' ? { ...msg, read: true } : msg
        )
      };
    });
  }, []); // No dependencies needed

  useEffect(() => {
    // If no user is provided through props, try to get from localStorage
    if (!userRef.current) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser && (parsedUser._id || parsedUser.id)) {
            userRef.current = parsedUser;
          } else {
            setError('Invalid user data. Please login again.');
          }
        } catch (err) {
          console.error('Error parsing saved user:', err);
          setError('Session expired. Please login again.');
        }
      } else {
        setError('Please login to continue.');
      }
    }
    setLoading(false);
  }, []);

  // Set up socket connection with reconnection handling
  useEffect(() => {
    let reconnectTimer;
    const maxRetries = 5;
    let retryCount = 0;

    const setupSocket = () => {
      const user = userRef.current;
      if (!user?._id || socketRef.current?.connected) return;

      try {
        socketRef.current = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: maxRetries,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
          query: { 
            userId: user._id,
            role: user.role
          }
        });

        socketRef.current.on('connect', () => {
          console.log('Socket connected:', socketRef.current.id);
          setSocket(socketRef.current);
          
          // Join user's room
          socketRef.current.emit('join', user._id, (error) => {
            if (error) {
              console.error('Error joining room:', error);
              setError('Failed to join chat room. Please refresh the page.');
            }
          });
        });

        socketRef.current.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          if (retryCount < maxRetries) {
            retryCount++;
            reconnectTimer = setTimeout(setupSocket, 2000);
          }
        });

        socketRef.current.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          setSocket(null);
          
          if (reason === 'io server disconnect') {
            if (retryCount < maxRetries) {
              retryCount++;
              reconnectTimer = setTimeout(setupSocket, 2000);
            }
          }
        });

        // Handle incoming messages
        socketRef.current.on('newMessage', (data) => {
          if (!data?.message || !data?.sender) return;
          
          const { message: newMsg, sender } = data;
          handleNewMessage(newMsg, sender);
        });

        // Handle read receipts
        socketRef.current.on('messageRead', (data) => {
          if (!data?.senderId) return;
          handleMessageRead(data.senderId);
        });
      } catch (error) {
        console.error('Socket setup error:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          reconnectTimer = setTimeout(setupSocket, 2000);
        }
      }
    };

    setupSocket();

    // Cleanup function
    return () => {
      clearTimeout(reconnectTimer);
      if (socketRef.current) {
        socketRef.current.offAny();
        socketRef.current.disconnect();
        setSocket(null);
      }
    };
  }, [handleMessageRead, handleNewMessage]);

  // Fetch users with proper error handling
  const fetchUsers = useCallback(async () => {
    if (!isAuthenticated) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await getMessagingUsers();
      
      if (response?.data) {
        if (Array.isArray(response.data.users)) {
          setUsers(response.data.users);
        } else if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else {
          setUsers([]);
          setError('No users available at the moment');
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      const errorMessage = err.response?.data?.message || 
                         'Failed to load users. Please try again.';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial user fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const department = (user.department || '').toLowerCase();
    const batch = (user.batch || '').toString().toLowerCase();
    const role = (user.role || '').toLowerCase();
    
    return fullName.includes(searchTermLower) || 
           department.includes(searchTermLower) ||
           batch.includes(searchTermLower) ||
           role.includes(searchTermLower);
  });

  // Load conversation when a user is selected
  const selectUser = async (user) => {
    setSelectedUser(user);
    setUnreadCounts(prev => ({ ...prev, [user._id]: 0 }));
    
    try {
      const response = await getConversation(user._id);
      if (response && response.data) {
        setConversations(prev => ({
          ...prev,
          [user._id]: response.data
        }));
        
        // Mark messages as read
        if (socket) {
          socket.emit('markAsRead', { senderId: user._id });
        }
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Failed to load conversation history');
    }
  };

  // Send message function
  const sendMessage = async () => {
    if (!message.trim() || !selectedUser) {
      setError('Please select a user and type a message');
      return;
    }

    try {
      const messageData = {
        recipientId: selectedUser._id,
        text: message.trim()
      };

      // Send through API first
      const response = await apiSendMessage(messageData);
      
      if (!response?.data) {
        throw new Error('No response from server');
      }

      // Add message to local state
      const newMessage = {
        sender: 'current',
        text: message.trim(),
        timestamp: new Date(),
        read: false
      };

      setConversations(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), newMessage]
      }));

      // Clear message and any errors
      setMessage('');
      setError('');
      setShowEmojiPicker(false);

      // Notify through socket if connected
      if (socket?.connected) {
        socket.emit('sendMessage', {
          recipientId: selectedUser._id,
          message: response.data
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  // Handle socket messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (!data?.message || !data?.sender) return;
      
      const { message: newMsg, sender } = data;
      const formattedMsg = {
        sender: sender._id,
        text: newMsg.text,
        timestamp: new Date(newMsg.createdAt || Date.now()),
        read: false
      };

      setConversations(prev => ({
        ...prev,
        [sender._id]: [...(prev[sender._id] || []), formattedMsg]
      }));

      // Update unread count if message is from someone other than selected user
      if (sender._id !== selectedUser?._id) {
        setUnreadCounts(prev => ({
          ...prev,
          [sender._id]: (prev[sender._id] || 0) + 1
        }));
      }
    };

    socket.on('newMessage', handleNewMessage);
    return () => socket.off('newMessage', handleNewMessage);
  }, [socket, selectedUser]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect for scrolling to bottom on conversation change
  useEffect(() => {
    scrollToBottom();
  }, [conversations, selectedUser]);

  const formatTimestamp = (timestamp) => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="connect-container">
        <div className="no-auth-message">
          <div className="message-icon">🔒</div>
          <h3>Authentication Required</h3>
          <p>Please log in to view and chat with other users.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="connect-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="connect-container">
        <div className="error-container">
          <div className="message-icon">⚠️</div>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="retry-button" onClick={fetchUsers}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-container">
      <div className="users-list">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="users">
          {filteredUsers.map(user => (
            <div
              key={user._id}
              className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
              onClick={() => selectUser(user)}
            >
              <div className="user-avatar">
                {user.profilePhoto ? (
                  <img 
                    src={getFullImageUrl(user.profilePhoto)} 
                    alt={`${user.firstName} ${user.lastName}`}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-initials">
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                {unreadCounts[user._id] > 0 && (
                  <span className="unread-badge">
                    {unreadCounts[user._id]}
                  </span>
                )}
              </div>
              <div className="user-info">
                <div className="user-name">
                  {user.firstName} {user.lastName}
                </div>
                <div className="user-details">
                  <span>{user.department}</span>
                  {user.batch && <span> • Batch {user.batch}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="chat-area">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <div className="selected-user-avatar">
                {selectedUser.profilePhoto ? (
                  <img 
                    src={getFullImageUrl(selectedUser.profilePhoto)} 
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="avatar-image"
                  />
                ) : (
                  <div className="avatar-initials">
                    {getInitials(selectedUser.firstName, selectedUser.lastName)}
                  </div>
                )}
              </div>
              <div className="chat-user-info">
                <h3>{selectedUser.firstName} {selectedUser.lastName}</h3>
                <div className="user-status">
                  <span>{selectedUser.role}</span>
                  {selectedUser.department && <span> • {selectedUser.department}</span>}
                  {selectedUser.batch && <span> • Batch {selectedUser.batch}</span>}
                </div>
              </div>
              <button 
                className="close-chat"
                onClick={() => setSelectedUser(null)}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            <div className="messages-container">
              <div className="messages">
                {conversations[selectedUser._id]?.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.sender === 'current' ? 'sent' : 'received'}`}
                  >
                    {msg.sender !== 'current' && !conversations[selectedUser._id][index - 1]?.sender === msg.sender && (
                      <div className="message-avatar">
                        {selectedUser.profilePhoto ? (
                          <img 
                            src={getFullImageUrl(selectedUser.profilePhoto)} 
                            alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                            className="avatar-image-small"
                          />
                        ) : (
                          <div className="avatar-initials-small">
                            {getInitials(selectedUser.firstName, selectedUser.lastName)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="message-content">{msg.text}</div>
                    <div className="message-timestamp">
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="message-input">
              {showEmojiPicker && (
                <div className="emoji-picker">
                  {emojis.map(emoji => (
                    <span
                      key={emoji}
                      onClick={() => {
                        setMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              <button
                className="emoji-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                type="button"
              >
                😊
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Type a message..."
              />
              <button
                className="send-button"
                onClick={sendMessage}
                disabled={!message.trim()}
                type="button"
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="message-icon">💬</div>
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Connect;
