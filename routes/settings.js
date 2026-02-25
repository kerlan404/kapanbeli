const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

// Get settings page
router.get('/profile', settingsController.getProfile);

// Update profile (name, email)
router.put('/profile', settingsController.updateProfile);

// Update password
router.put('/password', settingsController.updatePassword);

// Upload profile photo
router.post('/photo', settingsController.uploadProfilePhoto);

// Delete account
router.delete('/account', settingsController.deleteAccount);

// Get current user's data (products, suggestions, notes)
router.get('/data', settingsController.getUserData);

module.exports = router;
