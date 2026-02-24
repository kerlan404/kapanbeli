const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Akses ditolak. Admin saja.'
        });
    }
};

// Semua route analytics memerlukan admin
router.use(isAdmin);

/**
 * GET /api/admin/analytics/summary
 * Quick summary untuk dashboard cards
 */
router.get('/summary', adminAnalyticsController.getSummary.bind(adminAnalyticsController));

/**
 * GET /api/admin/analytics
 * Full analytics data dengan filter range
 * Query params: range=today|7days|month
 */
router.get('/', adminAnalyticsController.getAnalytics.bind(adminAnalyticsController));

module.exports = router;
