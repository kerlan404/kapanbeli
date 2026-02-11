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

// Endpoint untuk mendapatkan semua pengguna
router.get('/users', adminController.getAllUsers);

// Endpoint untuk mendapatkan log aktivitas
router.get('/activity', adminController.getActivityLogs);

// Endpoint untuk mendapatkan semua produk dari semua pengguna
router.get('/products', adminController.getAllProducts);

// Endpoint untuk mendapatkan detail pengguna
router.get('/user/:id', adminController.getUserById);

// Endpoint untuk mendapatkan produk dari pengguna tertentu
router.get('/user/:id/products', adminController.getUserProducts);

module.exports = router;