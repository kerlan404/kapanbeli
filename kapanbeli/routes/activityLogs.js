/**
 * Activity Logs Routes
 * API endpoints untuk activity logs
 */

const express = require('express');
const router = express.Router();
const activityLogsController = require('../controllers/activityLogsController');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    console.log('[activityLogs.isAuthenticated] Session exists:', !!req.session);
    console.log('[activityLogs.isAuthenticated] Session user:', req.session?.user);

    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required. Silakan login terlebih dahulu.'
        });
    }
};

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    console.log('[activityLogs.isAdmin] User role:', req.session?.user?.role);

    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

/**
 * @route GET /api/activity-logs
 * @desc Get activity logs dengan pagination dan filter
 * @access Private (Admin untuk semua user, User untuk diri sendiri)
 * @query {string} range - today | 7days | month
 * @query {string} search - Search by user name
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 * @query {string} activityType - Filter by activity type
 * @query {number} userId - Filter by user (optional, jika bukan admin akan filter ke user sendiri)
 */
router.get('/', isAuthenticated, (req, res, next) => {
    // Jika user adalah admin atau meminta data sendiri, lanjutkan
    const isOwnData = req.query.userId && parseInt(req.query.userId) === req.session.user.id;
    const isRequestingOwnWithoutParam = !req.query.userId;

    if (req.session.user.role === 'admin' || isOwnData || isRequestingOwnWithoutParam) {
        // Jika bukan admin dan tidak ada userId param, set userId ke user sendiri
        if (req.session.user.role !== 'admin' && !req.query.userId) {
            req.query.userId = req.session.user.id;
        }
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Anda hanya dapat melihat aktivitas Anda sendiri.'
        });
    }
}, activityLogsController.getLogs.bind(activityLogsController));

/**
 * @route GET /api/activity-logs/statistics
 * @desc Get activity statistics
 * @access Private (Admin)
 * @query {string} range - today | 7days | month
 */
router.get('/statistics', isAuthenticated, isAdmin, activityLogsController.getStatistics.bind(activityLogsController));

/**
 * @route POST /api/activity-logs
 * @desc Create new activity log (internal use)
 * @access Private
 */
router.post('/', isAuthenticated, activityLogsController.createLog.bind(activityLogsController));

/**
 * @route GET /api/activity-logs/login-history
 * @desc Get login history for a user (fallback when activity_logs is empty)
 * @access Private
 */
router.get('/login-history', isAuthenticated, async (req, res) => {
    try {
        const db = require('../config/database');
        const userId = req.query.userId || req.session.user.id;

        const [logs] = await db.execute(`
            SELECT 
                id,
                user_id,
                'LOGIN' as activity_type,
                CONCAT('Login dari ', ip_address) as description,
                login_time as created_at,
                ip_address
            FROM login_logs
            WHERE user_id = ?
            ORDER BY login_time DESC
            LIMIT 10
        `, [userId]);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Login history error:', error);
        res.json({
            success: false,
            data: [],
            message: error.message
        });
    }
});

module.exports = router;
