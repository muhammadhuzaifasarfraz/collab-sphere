// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendWelcomeEmail = require('../mail/welcomeMail'); // ⬅️ valid import (no top-level await)

// SIGNUP Controller
exports.signup = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please provide all required information (email, password, firstName, lastName, role)'
      });
    }

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      department: req.body.department || '',
      batch: req.body.batch || '',
      profilePhoto: req.body.profilePhoto || ''
    });

    await user.save();

    // Send welcome email only after saving user
    await sendWelcomeEmail(email, firstName);

    const userResponse = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department || '',
      batch: user.batch || '',
      profilePhoto: user.profilePhoto || ''
    };

    res.status(201).json({ message: 'User created successfully', user: userResponse });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(400).json({ error: 'Email already in use or invalid data' });
  }
};

// LOGIN Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.firstName || !user.lastName) {
      return res.status(400).json({ 
        error: 'Incomplete profile',
        message: 'Your profile is incomplete. Please update your profile with required information.'
      });
    }

    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department || '',
      batch: user.batch || '',
      profilePhoto: user.profilePhoto || ''
    };

    console.log('User logged in successfully:', userResponse);
    res.status(200).json({ 
      message: 'Login successful', 
      user: userResponse,
      token 
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
