const checkProfileComplete = async (req, res, next) => {
  try {
    const user = req.user;

    // Check for required fields
    const requiredFields = ['firstName', 'lastName', 'role'];
    const missingFields = requiredFields.filter(field => !user[field]);

    if (missingFields.length > 0) {
      return res.status(403).json({
        error: 'Incomplete profile',
        message: `Please complete your profile. Missing fields: ${missingFields.join(', ')}`,
        redirectTo: '/complete-profile',
        userId: user._id
      });
    }

    next();
  } catch (error) {
    console.error('Profile Check Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = checkProfileComplete;
