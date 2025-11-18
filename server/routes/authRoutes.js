const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { signup, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    try {
      console.log('File upload attempt:', {
        originalname: file.originalname,
        mimetype: file.mimetype
      });

      if (!file.mimetype.startsWith('image/')) {
        console.log('Invalid mimetype:', file.mimetype);
        return cb(new Error('Only image files are allowed'), false);
      }

      console.log('File validation passed for image:', file.mimetype);
      return cb(null, true);
    } catch (err) {
      console.error('Error in file filter:', err);
      return cb(new Error('Error processing file upload'));
    }
  }
});

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes - require authentication
router.use(authMiddleware);

// Get user profile
router.get('/profile', (req, res) => {
  res.json(req.user);
});

// Update user profile
router.put('/update', async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow email or password updates through this route
    delete updates.email;
    delete updates.password;

    // Preserve required fields if they're not in the updates
    const user = await req.user.set({
      ...req.user.toObject(),
      ...updates,
      role: updates.role || req.user.role // Ensure role is preserved
    }).save();
    res.json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      batch: user.batch,
      profilePhoto: user.profilePhoto,
      rollNumber: user.rollNumber
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload profile photo
router.post('/upload-photo', upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Log upload details for debugging
    console.log('File upload details:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    // Update user's profile photo URL
    const photoUrl = `/uploads/${req.file.filename}`;
    console.log('New photo URL:', photoUrl);
    
    // Update user profile with new photo URL
    await req.user.set({ profilePhoto: photoUrl }).save();
    console.log('User profile updated with new photo');

    res.json({
      photoUrl,
      message: 'Profile photo updated successfully'
    });
  } catch (err) {
    console.error('Photo upload error:', err);
    if (err.code) console.error('Error code:', err.code);
    if (err.message) console.error('Error message:', err.message);
    if (err.stack) console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Failed to upload photo', details: err.message });
  }
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    console.error('Multer error:', err);
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  } else if (err) {
    // An unknown error occurred when uploading
    console.error('Upload error:', err);
    return res.status(400).json({
      error: 'File upload error',
      details: err.message
    });
  }
  next();
});

module.exports = router;
