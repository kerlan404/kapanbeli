/**
 * Dashboard Routes
 * Endpoint untuk statistik dan data dashboard
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Middleware autentikasi untuk semua route dashboard
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Akses ditolak. Silakan login terlebih dahulu.'
        });
    }
};

// Terapkan middleware ke semua route
router.use(isAuthenticated);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Ambil semua statistik dashboard
 * @access  Private (requires login)
 * 
 * Response example:
 * {
 *   "success": true,
 *   "stats": {
 *     "totalProducts": 25,
 *     "lowStock": 3,
 *     "outOfStock": 1,
 *     "shoppingList": 4,
 *     "expired": 2,
 *     "expiringSoon": 5,
 *     "totalNotes": 10,
 *     "totalUsers": 1
 *   },
 *   "lastUpdated": "2026-02-24T10:30:00.000Z"
 * }
 */
router.get('/stats', dashboardController.getStats);

/**
 * @route   GET /api/dashboard/quick-stats
 * @desc    Ambil statistik cepat (lebih ringan untuk auto-refresh)
 * @access  Private
 */
router.get('/quick-stats', dashboardController.getQuickStats);

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Dapatkan daftar produk yang butuh perhatian
 * @access  Private
 */
router.get('/alerts', dashboardController.getAlerts);

module.exports = router;
