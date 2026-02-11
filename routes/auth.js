const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route untuk halaman login dan register (akan ditangani oleh server.js atau view engine)
// Kita fokus pada API routes di sini

// Route untuk login
router.post('/login', authController.login);

// Route untuk register
router.post('/signup', authController.register);

// Route untuk logout
router.get('/logout', authController.logout);

// Route untuk konfirmasi akun
router.get('/confirm/:token', authController.confirmAccount);

// Route untuk memeriksa status otentikasi
router.get('/status', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: {
                id: req.session.user.id,
                name: req.session.user.name,
                email: req.session.user.email,
                role: req.session.user.role || 'user'
            }
        });
    } else {
        res.json({ authenticated: false });
    }
});

module.exports = router;