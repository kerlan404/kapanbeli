const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route untuk halaman login
router.get('/login', (req, res) => {
    res.sendFile(__dirname + '/../views/login.html');
});

// Route untuk halaman register
router.get('/register', (req, res) => {
    res.sendFile(__dirname + '/../views/register.html');
});

// Route untuk proses login
router.post('/login', authController.login);

// Route untuk proses register
router.post('/register', authController.register);

// Route untuk logout
router.get('/logout', authController.logout);

// Route untuk profile
router.get('/profile', authController.authenticateToken, authController.getProfile);

// Route untuk update profile
router.put('/profile', authController.authenticateToken, authController.updateProfile);

module.exports = router;