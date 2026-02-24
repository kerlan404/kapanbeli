/**
 * Activity Logs Service
 * Service untuk mencatat aktivitas user di sistem
 * 
 * Usage:
 * const activityLogs = require('./services/activityLogsService');
 * await activityLogs.log(user_id, 'LOGIN', 'User login berhasil', ip_address);
 */

const db = require('../config/database');

const ActivityType = {
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    VIEW: 'VIEW',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    BAN: 'BAN',
    UNBAN: 'UNBAN'
};

const activityLogsService = {
    /**
     * Log aktivitas user
     * @param {number} userId - ID user
     * @param {string} activityType - Tipe aktivitas (LOGIN, CREATE, UPDATE, DELETE, dll)
     * @param {string} description - Deskripsi aktivitas
     * @param {string|null} ip - IP address user
     * @param {string|null} userAgent - User agent browser
     * @returns {Promise<object>} Result insert
     */
    async log(userId, activityType, description, ip = null, userAgent = null) {
        try {
            // Set timezone ke Asia/Jakarta
            await db.execute("SET time_zone = '+07:00'");
            
            const query = `
                INSERT INTO activity_logs (user_id, activity_type, description, ip_address, user_agent)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await db.execute(query, [
                userId,
                activityType,
                description,
                ip,
                userAgent
            ]);
            
            return {
                success: true,
                id: result.insertId,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error logging activity:', error);
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Get activity logs dengan pagination dan filter
     * @param {object} options - Query options
     * @param {string} options.range - today | 7days | month
     * @param {string} options.search - Search keyword (nama user)
     * @param {number} options.page - Page number
     * @param {number} options.limit - Items per page
     * @param {string} options.activityType - Filter by activity type
     * @returns {Promise<object>} Paginated results
     */
    async getLogs(options = {}) {
        try {
            const {
                range = '7days',
                search = '',
                page = 1,
                limit = 10,
                activityType = ''
            } = options;

            // Set timezone
            await db.execute("SET time_zone = '+07:00'");

            // Build date filter
            let dateFilter = '';
            switch (range) {
                case 'today':
                    dateFilter = 'AND DATE(al.created_at) = CURDATE()';
                    break;
                case '7days':
                    dateFilter = 'AND al.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    dateFilter = 'AND MONTH(al.created_at) = MONTH(CURDATE()) AND YEAR(al.created_at) = YEAR(CURDATE())';
                    break;
            }

            // Build search filter
            const searchFilter = search ? 'AND (u.name LIKE ? OR u.email LIKE ?)' : '';
            const searchParams = search ? [`%${search}%`, `%${search}%`] : [];

            // Build activity type filter
            const activityTypeFilter = activityType ? 'AND al.activity_type = ?' : '';
            const activityTypeParams = activityType ? [activityType] : [];

            // Calculate offset
            const offset = (page - 1) * limit;

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM activity_logs al
                JOIN users u ON al.user_id = u.id
                WHERE 1=1 ${dateFilter} ${searchFilter} ${activityTypeFilter}
            `;
            
            const [countResult] = await db.execute(countQuery, [...searchParams, ...activityTypeParams]);
            const total = countResult[0].total;

            // Get paginated data
            const dataQuery = `
                SELECT 
                    al.id,
                    al.user_id,
                    al.activity_type,
                    al.description,
                    al.ip_address,
                    al.user_agent,
                    al.created_at,
                    u.name as user_name,
                    u.email as user_email
                FROM activity_logs al
                JOIN users u ON al.user_id = u.id
                WHERE 1=1 ${dateFilter} ${searchFilter} ${activityTypeFilter}
                ORDER BY al.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            const [dataResult] = await db.execute(dataQuery, [
                ...searchParams,
                ...activityTypeParams,
                limit,
                offset
            ]);

            return {
                success: true,
                data: dataResult,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error getting activity logs:', error);
            return {
                success: false,
                error: error.message,
                data: [],
                pagination: {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 0
                }
            };
        }
    },

    /**
     * Get activity statistics
     * @param {string} range - today | 7days | month
     * @returns {Promise<object>} Statistics
     */
    async getStatistics(range = '7days') {
        try {
            await db.execute("SET time_zone = '+07:00'");

            let dateFilter = '';
            switch (range) {
                case 'today':
                    dateFilter = 'WHERE DATE(created_at) = CURDATE()';
                    break;
                case '7days':
                    dateFilter = 'WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
                    break;
                case 'month':
                    dateFilter = 'WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
                    break;
            }

            const query = `
                SELECT 
                    activity_type,
                    COUNT(*) as count
                FROM activity_logs
                ${dateFilter}
                GROUP BY activity_type
                ORDER BY count DESC
            `;

            const [result] = await db.execute(query);

            // Format result
            const stats = {};
            result.forEach(row => {
                stats[row.activity_type] = row.count;
            });

            return {
                success: true,
                stats,
                total: result.reduce((sum, row) => sum + row.count, 0)
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                success: false,
                error: error.message,
                stats: {},
                total: 0
            };
        }
    }
};

module.exports = {
    ActivityType,
    ...activityLogsService
};
