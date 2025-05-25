const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, certifications } = req.body;

    // Check if email is already used
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const userData = {
      name,
      email,
      passwordHash,
      role
    };

    if (role === 'exporter' && certifications) {
      userData.companyInfo = {
        certifications: certifications
      };
    }

    const user = new User(userData);

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error logging in' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Error fetching user data' });
  }
};

exports.getExporters = async (req, res) => {
  try {
    const exporters = await User.find({ role: 'exporter' }).select('name');

    res.json(exporters);
  } catch (err) {
    console.error('Error fetching exporters:', err);
    res.status(500).json({ error: 'Error fetching exporters' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const { currency } = req.body;
    const allowedCurrencies = ['AUD', 'GBP', 'EUR', 'JPY', 'SGD', 'CHF', 'USD', 'LKR'];
    if (!allowedCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { 'preferences.currency': currency } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferences: user.preferences
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};