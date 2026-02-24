/**
 * Admin Product Routes
 * Routes untuk manajemen produk di admin panel
 * Base path: /api/admin/products
 */

const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
};

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

// Apply authentication and admin check to all routes
router.use(isAuthenticated);
router.use(isAdmin);

/**
 * @route GET /admin/products
 * @desc Tampilkan halaman manajemen produk
 * @access Private (Admin)
 */
router.get('/', adminProductController.showProductsPage);

/**
 * @route GET /api/admin/products
 * @desc API endpoint untuk mendapatkan daftar produk
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} search - Search by product name or user name/email
 * @query {string} category - Filter by category
 * @query {string} stockStatus - Filter by stock status (all, low, out, good)
 * @query {string} sortBy - Sort column (name, stock_quantity, created_at)
 * @query {string} sortOrder - Sort order (ASC, DESC)
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

module.exports = router;
