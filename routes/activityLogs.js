/**
 * Activity Logs Routes
 * API endpoints untuk activity logs
 */

const express = require('express');
const router = express.Router();
const activityLogsController = require('../controllers/activityLogsController');

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

/**
 * @route GET /api/activity-logs
 * @desc Get activity logs dengan pagination dan filter
 * @access Private (Admin)
 * @query {string} range - today | 7days | month
 * @query {string} search - Search by user name
 * @query {number} page - Page number
 * @query {number} limit - Items per page
 * @query {string} activityType - Filter by activity type
 */
router.get('/', isAuthenticated, isAdmin, activityLogsController.getLogs.bind(activityLogsController));

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

module.exports = router;
