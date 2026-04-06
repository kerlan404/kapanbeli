/**
 * Admin Product Routes - FIXED
 * Routes untuk manajemen produk di admin panel
 * 
 * PENTING: Pisahkan route VIEW dan route API!
 * - Route VIEW: GET /admin/products (render EJS)
 * - Route API: GET /api/admin/products (return JSON)
 */

const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        // PENTING: Untuk API, JANGAN redirect! Kirim JSON error
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        return res.redirect('/auth');
    }
};

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        // PENTING: Untuk API, JANGAN redirect! Kirim JSON error
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }
        return res.status(403).send('Access denied. Admins only.');
    }
};

// Apply authentication and admin check to all routes
router.use(isAuthenticated);
router.use(isAdmin);

// ============================================
// API ROUTES - Return JSON
// ============================================

/**
 * @route GET /api/admin/products
 * @desc API endpoint untuk mendapatkan daftar produk
 * @access Private (Admin)
 */
router.get('/', adminProductController.getProducts);

/**
 * @route GET /api/admin/products/statistics
 * @desc API endpoint untuk mendapatkan statistik produk
 * @access Private (Admin)
 */
router.get('/statistics', adminProductController.getStatistics);

/**
 * @route GET /api/admin/products/:id
 * @desc API endpoint untuk mendapatkan detail produk
 * @access Private (Admin)
 */
router.get('/:id', adminProductController.getProduct);

/**
 * @route POST /api/admin/products
 * @desc API endpoint untuk create produk baru
 * @access Private (Admin)
 */
router.post('/', adminProductController.createProduct);

/**
 * @route PUT /api/admin/products/:id
 * @desc API endpoint untuk update produk
 * @access Private (Admin)
 */
router.put('/:id', adminProductController.updateProduct);

/**
 * @route DELETE /api/admin/products/:id
 * @desc API endpoint untuk hapus produk
 * @access Private (Admin)
 */
router.delete('/:id', adminProductController.deleteProduct);

/**
 * @route PATCH /api/admin/products/:id/toggle-status
 * @desc API endpoint untuk toggle status produk
 * @access Private (Admin)
 */
router.patch('/:id/toggle-status', adminProductController.toggleStatus);

/**
 * @route PATCH /api/admin/products/:id/deactivate
 * @desc API endpoint untuk menonaktifkan produk oleh admin
 * @access Private (Admin)
 */
router.patch('/:id/deactivate', adminProductController.deactivateProduct);

/**
 * @route PATCH /api/admin/products/:id/reactivate
 * @desc API endpoint untuk mengaktifkan kembali produk oleh admin
 * @access Private (Admin)
 */
router.patch('/:id/reactivate', adminProductController.reactivateProduct);

module.exports = router;
