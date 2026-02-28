const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route untuk halaman login dan register (akan ditangani oleh server.js atau view engine)
// Kita fokus pada API routes di sini

// Route untuk login
router.post('/login', authController.login);

// Route untuk register
router.post('/signup', authController.register);

// Route untuk logout (support both GET and POST)
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// Route untuk konfirmasi akun
router.get('/confirm/:token', authController.confirmAccount);

// Route untuk memeriksa status otentikasi
router.get('/status', async (req, res) => {
    if (req.session.user) {
        try {
            // Get user with profile photo from database
            const User = require('../models/User');
            const user = await User.findById(req.session.user.id);

            if (user) {
                res.json({
                    authenticated: true,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        profile_photo: user.profile_photo || null,
                        role: user.role || 'user'
                    }
                });
            } else {
                // User not found in database, clear session
                req.session.destroy();
                res.json({ authenticated: false });
            }
        } catch (error) {
            console.error('Auth status error:', error);
            res.status(500).json({ 
                authenticated: false,
                message: 'Error checking auth status' 
            });
        }
    } else {
        res.json({ authenticated: false });
    }
});

// Route untuk halaman lupa password
router.get('/forgot-password', authController.showForgotPassword);

// Route untuk mengirim permintaan reset password
router.post('/forgot-password', authController.forgotPassword);

// Route untuk halaman reset password
router.get('/reset-password/:token', authController.showResetPassword);

// Route untuk mengatur password baru
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;