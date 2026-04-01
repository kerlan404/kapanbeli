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

// Dashboard stats
router.get('/stats', isAdmin, adminController.getStats);

// Users management
router.get('/users', isAdmin, adminController.getAllUsers);
router.get('/users/banned', isAdmin, adminController.getBannedUsers);

// User detail
router.get('/user/:id', isAdmin, adminController.getUserById);
router.get('/user/:id/products', isAdmin, adminController.getUserProducts);

// Ban/Unban user
router.post('/user/:userId/ban', isAdmin, adminController.banUser);
router.post('/user/:userId/unban', isAdmin, adminController.unbanUser);

// Active users widget
router.get('/stats/active-users', isAdmin, adminController.getActiveUsers);

module.exports = router;
