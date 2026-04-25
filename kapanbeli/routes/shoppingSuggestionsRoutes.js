/**
 * Shopping Suggestions Routes
 * Routes untuk halaman saran pembelian
 */

const express = require('express');
const router = express.Router();
const shoppingSuggestionsController = require('../controllers/shoppingSuggestionsController');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
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
 * @route GET /api/admin/shopping-suggestions
 * @desc API endpoint untuk mendapatkan saran pembelian
 * @access Private (Admin)
 */
router.get('/', shoppingSuggestionsController.getSuggestions);

/**
 * @route GET /api/admin/shopping-suggestions/statistics
 * @desc API endpoint untuk mendapatkan statistik
 * @access Private (Admin)
 */
router.get('/statistics', shoppingSuggestionsController.getStatistics);

module.exports = router;
