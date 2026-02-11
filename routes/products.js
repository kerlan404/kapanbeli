// routes/products.js
const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

// Middleware untuk memeriksa apakah pengguna sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });
    }
};

// Semua route produk memerlukan otentikasi
router.use(isAuthenticated);

// Endpoint untuk mendapatkan semua produk
router.get('/', productsController.getAll);

// Endpoint untuk mendapatkan satu produk berdasarkan ID
router.get('/:id', productsController.getById);

// Endpoint untuk membuat produk baru
router.post('/', productsController.create);

// Endpoint untuk memperbarui produk
router.put('/:id', productsController.update);

// Endpoint untuk menghapus produk
router.delete('/:id', productsController.delete);

// Endpoint untuk mendapatkan statistik produk
router.get('/stats', productsController.getStats);

// Endpoint untuk mendapatkan detail produk
router.get('/:id', productsController.getDetail);

module.exports = router;