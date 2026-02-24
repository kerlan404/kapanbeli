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

// Endpoint untuk mendapatkan statistik dashboard
router.get('/stats', adminController.getStats);

// Endpoint untuk mendapatkan semua pengguna (deprecated - gunakan /api/users)
router.get('/users', async (req, res) => {
    try {
        // Redirect ke endpoint baru atau gunakan userService
        const userService = require('../services/userService');
        const result = await userService.getUsers({ page: 1, limit: 100 });
        res.json({ success: true, users: result.data });
    } catch (error) {
        console.error('Error in /api/admin/users:', error);
        res.status(500).json({ success: false, message: error.message, users: [] });
    }
});

// Endpoint untuk mendapatkan log aktivitas
router.get('/activity', adminController.getActivityLogs);

// Endpoint untuk mendapatkan semua produk dari semua pengguna
router.get('/products', adminController.getAllProducts);

// Endpoint untuk mendapatkan detail pengguna
router.get('/user/:id', adminController.getUserById);

// Endpoint untuk mendapatkan produk dari pengguna tertentu
router.get('/user/:id/products', adminController.getUserProducts);

// Endpoint untuk BAN user
router.post('/user/:userId/ban', adminController.banUser);

// Endpoint untuk UNBAN user
router.post('/user/:userId/unban', adminController.unbanUser);

// Endpoint untuk mendapatkan user yang di-ban
router.get('/users/banned', adminController.getBannedUsers);

// Endpoint untuk mendapatkan statistik produk per user
router.get('/stats/products-by-user', adminController.getProductStatsByUser);

// Endpoint untuk mendapatkan aktivitas login
router.get('/stats/login-activity', adminController.getLoginActivity);

module.exports = router;