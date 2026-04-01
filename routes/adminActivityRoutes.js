/**
 * Admin Activity Logs Routes
 * Routes untuk monitoring aktivitas user di admin panel
 * Base path: /api/admin/activity-logs
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getPaginationParams, buildPagination, sanitizeString, calculateOffset } = require('../helpers/paginationHelper');

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

// Debug logging
router.use((req, res, next) => {
    console.log('adminActivityRoutes received request:', req.method, req.path);
    next();
});

/**
 * @route GET /api/admin/activity/statistics
 * Get activity statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        // Total users
        const [totalUsersResult] = await db.execute('SELECT COUNT(*) as total FROM users');

        // Online users (logged in today)
        const [onlineResult] = await db.execute(`
            SELECT COUNT(DISTINCT user_id) as total
            FROM login_logs
            WHERE DATE(login_time) = CURDATE()
        `);

        const offline = totalUsersResult[0].total - onlineResult[0].total;

        // Today logins
        const [todayLoginsResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM login_logs
            WHERE DATE(login_time) = CURDATE()
        `);

        // Total activity
        const [totalActivityResult] = await db.execute('SELECT COUNT(*) as total FROM login_logs');

        res.json({
            success: true,
            data: {
                totalUsers: totalUsersResult[0].total,
                online: onlineResult[0].total,
                offline: offline,
                todayLogins: todayLoginsResult[0].total,
                totalActivity: totalActivityResult[0].total
            }
        });
    } catch (error) {
        console.error('Error getting activity statistics:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route GET /api/admin/activity/user-status
 * Get user status (online/offline)
 */
router.get('/user-status', async (req, res) => {
    try {
        const [users] = await db.execute(`
            SELECT
                u.id, u.name, u.email,
                COALESCE(u.account_status, u.status, 'active') as status,
                u.last_login, u.last_logout, u.last_ip,
                u.login_count,
                CASE
                    WHEN u.last_login > COALESCE(u.last_logout, '0000-00-00 00:00:00')
                    THEN TRUE
                    ELSE FALSE
                END as is_online
            FROM users u
            ORDER BY u.last_login DESC
        `);

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error getting user status:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route GET /api/admin/activity-logs
 * Get activity logs with pagination
 */
router.get('/', async (req, res) => {
    try {
        // Use safe pagination helper
        const pagination = getPaginationParams(req.query);
        const { page, limit } = pagination;
        const offset = calculateOffset(page, limit);

        const { search, activity_type, status } = req.query;

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (u.name LIKE ? OR u.email LIKE ?)';
            const searchPattern = `%${sanitizeString(search)}%`;
            params.push(searchPattern, searchPattern);
        }

        if (activity_type) {
            // Filter by activity type (login/logout)
            if (activity_type === 'login') {
                whereClause += " AND ll.logout_time IS NULL";
            } else if (activity_type === 'logout') {
                whereClause += " AND ll.logout_time IS NOT NULL";
            }
        }

        if (status) {
            if (status === 'online') {
                whereClause += " AND u.last_login > COALESCE(u.last_logout, '0000-00-00 00:00:00')";
            } else if (status === 'offline') {
                whereClause += " AND (u.last_logout > u.last_login OR u.last_login IS NULL)";
            }
        }

        // Get total count
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM login_logs ll
            LEFT JOIN users u ON ll.user_id = u.id
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;

        // Get activity logs with user info
        const [logs] = await db.execute(`
            SELECT
                ll.id, ll.user_id, ll.login_time, ll.logout_time, ll.ip_address, ll.user_agent,
                ll.created_at,
                u.name as user_name, u.email as user_email, u.last_ip
            FROM login_logs ll
            LEFT JOIN users u ON ll.user_id = u.id
            WHERE ${whereClause}
            ORDER BY ll.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Format logs for display - determine activity type based on login/logout time
        const formattedLogs = logs.map(log => {
            // Determine if this is a login or logout based on the presence of logout_time
            const isLogin = !log.logout_time || log.login_time === log.created_at;
            const activityType = isLogin ? 'login' : 'logout';
            
            let description = '';
            if (isLogin) {
                description = `User login dari ${log.ip_address || 'IP tidak diketahui'}`;
            } else {
                description = `User logout`;
            }

            return {
                ...log,
                description,
                activity_type: activityType
            };
        });

        res.json({
            success: true,
            data: formattedLogs,
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        console.error('[adminActivityRoutes.activity-logs] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve activity logs: ' + error.message
        });
    }
});

module.exports = router;
