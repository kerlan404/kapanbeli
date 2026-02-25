// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Middleware untuk memeriksa apakah pengguna adalah admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya admin yang dapat mengakses fitur ini.'
        });
    }
};

// Semua route admin memerlukan otentikasi sebagai admin
router.use(isAdmin);

// Dashboard stats
router.get('/stats', adminController.getStats);

// Users management
router.get('/users', adminController.getAllUsers);
router.get('/users/banned', adminController.getBannedUsers);

// User detail
router.get('/user/:id', adminController.getUserById);
router.get('/user/:id/products', adminController.getUserProducts);

// Ban/Unban user
router.post('/user/:userId/ban', adminController.banUser);
router.post('/user/:userId/unban', adminController.unbanUser);

// Active users widget
router.get('/stats/active-users', adminController.getActiveUsers);

module.exports = router;
