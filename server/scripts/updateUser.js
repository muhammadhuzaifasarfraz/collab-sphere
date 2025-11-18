require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const updateUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collab-sphere');
    console.log('Connected to MongoDB');

    // Find user with incomplete data
    const user = await User.findById('6832dd36cf32dcd7fe1e9ce3');
    
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }

    // Update user data
    user.firstName = 'AJ'; // Replace with actual first name
    user.lastName = 'User'; // Replace with actual last name
    user.department = 'BCS'; // Replace with actual department
    user.batch = 'FA24'; // Replace with actual batch

    await user.save();
    console.log('User updated successfully:', user);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

updateUser();
