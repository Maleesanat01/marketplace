const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const userController = require('../controllers/userController');
const authenticateUser = require('../middleware/authMiddleware');


router.post('/register', userController.register);


router.post('/login', userController.login);


router.get('/me', authenticateUser, userController.getCurrentUser);
router.put('/profile', authenticateUser, userController.updateProfile);

// Get roles
router.get('/roles', (req, res) => {
  const allRoles = User.schema.path('role').enumValues;
  const filteredRoles = allRoles.filter(role => role !== 'admin');
  res.json(filteredRoles);
});

// Route to get exporters
router.get('/exporters', userController.getExporters);

// Update user preferences (currency)
router.put('/preferences', authenticateUser, userController.updatePreferences);

module.exports = router;
