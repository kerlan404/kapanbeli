const express = require('express');
const router = express.Router();
const notesController = require('../controllers/notesController');

// Middleware untuk memeriksa apakah pengguna sudah login
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Akses ditolak. Silakan login.' });
    }
};

// Semua route notes memerlukan otentikasi
router.use(isAuthenticated);

// Endpoint untuk mendapatkan semua catatan
router.get('/', notesController.getAll);

// Endpoint untuk mendapatkan satu catatan berdasarkan ID
router.get('/:id', notesController.getById);

// Endpoint untuk membuat catatan baru
router.post('/', notesController.create);

// Endpoint untuk memperbarui catatan
router.put('/:id', notesController.update);

// Endpoint untuk menghapus catatan
router.delete('/:id', notesController.delete);

// Endpoint untuk mendapatkan catatan terbaru
router.get('/recent', notesController.getRecent);

module.exports = router;