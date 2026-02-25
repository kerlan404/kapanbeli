/**
 * Admin Service
 * Centralized service for admin panel data operations
 * Provides consistent data fetching for dashboard and users pages
 * 
 * STATUS STANDARD:
 * - active: Pengguna aktif (normal)
 * - inactive: Pengguna tidak aktif
 * - suspended: Pengguna ditangguhkan (banned)
 * 
 * All queries use account_status as primary, with fallback to status for backward compatibility
 */

const db = require('../config/database');

const adminService = {
    /**
     * Get unified admin statistics
     * This is the SINGLE SOURCE OF TRUTH for admin stats
     * Used by both Dashboard and Users pages
     * 
     * STATUS COUNTS:
     * - activeUsers: Users with account_status = 'active' OR status = 'active'
     * - inactiveUsers: Users with account_status = 'inactive' OR status = 'inactive'
     * - suspendedUsers: Users with account_status = 'suspended' OR status = 'banned' OR is_banned = true
     */
    async getStats() {
        try {
            const stats = {};

            // Total users
            const [totalUsersResult] = await db.execute(
                'SELECT COUNT(*) as count FROM users'
            );
            stats.totalUsers = totalUsersResult[0].count;

            // Active users - using COALESCE for consistency across both columns
            // This query matches exactly what the users page uses for filtering
            const [activeUsersResult] = await db.execute(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE COALESCE(account_status, status, 'active') = 'active'
            `);
            stats.activeUsers = activeUsersResult[0].count;

            // Inactive users
            const [inactiveUsersResult] = await db.execute(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE COALESCE(account_status, status, 'active') = 'inactive'
            `);
            stats.inactiveUsers = inactiveUsersResult[0].count;

            // Suspended users (includes banned)
            const [suspendedUsersResult] = await db.execute(`
                SELECT COUNT(*) as count 
                FROM users 
                WHERE COALESCE(account_status, status, 'active') IN ('suspended', 'banned')
                OR is_banned = TRUE
            `);
            stats.suspendedUsers = suspendedUsersResult[0].count;

            // Total admins
            const [totalAdminResult] = await db.execute(
                "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
            );
            stats.totalAdmin = totalAdminResult[0].count;

            // Total regular users
            const [totalUserResult] = await db.execute(
                "SELECT COUNT(*) as count FROM users WHERE role = 'user'"
            );
            stats.totalRegularUsers = totalUserResult[0].count;

            // Validate: totalUsers should equal activeUsers + inactiveUsers + suspendedUsers
            const statusSum = stats.activeUsers + stats.inactiveUsers + stats.suspendedUsers;
            if (statusSum !== stats.totalUsers) {
                console.warn(
                    '[AdminService] Warning: User status counts do not match total.',
                    { total: stats.totalUsers, sum: statusSum }
                );
                // Recalculate to ensure consistency - active = total - inactive - suspended
                stats.activeUsers = stats.totalUsers - stats.inactiveUsers - stats.suspendedUsers;
            }

            // Additional stats for dashboard
            const [totalProductsResult] = await db.execute(
                'SELECT COUNT(*) as count FROM products'
            );
            stats.totalProducts = totalProductsResult[0].count;

            const [totalNotesResult] = await db.execute(
                'SELECT COUNT(*) as count FROM notes'
            );
            stats.totalNotes = totalNotesResult[0].count;

            // Users online today (logged in today)
            const [onlineTodayResult] = await db.execute(
                'SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_time) = CURDATE()'
            );
            stats.usersOnlineToday = onlineTodayResult[0].count;

            // New users today
            const [newUsersTodayResult] = await db.execute(
                'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'
            );
            stats.newUsersToday = newUsersTodayResult[0].count;

            // Logins today
            const [loginsTodayResult] = await db.execute(
                'SELECT COUNT(*) as count FROM login_logs WHERE DATE(login_time) = CURDATE()'
            );
            stats.loginsToday = loginsTodayResult[0].count;

            return stats;
        } catch (error) {
            console.error('[AdminService] Error getting stats:', error);
            throw error;
        }
    },

    /**
     * Get users with pagination and filters
     * 
     * STATUS FILTER: Uses COALESCE(account_status, status, 'active') for consistency
     */
    async getUsersWithStats(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                status = '',
                role = ''
            } = options;

            const offset = (page - 1) * limit;

            // Build WHERE clause
            const whereClauses = [];
            const params = [];

            // Search filter (name or email)
            if (search) {
                whereClauses.push('(u.name LIKE ? OR u.email LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            // Status filter - using COALESCE for consistency with getStats()
            // This ensures the "Aktif" count on dashboard matches the filtered list
            if (status && ['active', 'inactive', 'suspended'].includes(status)) {
                whereClauses.push('COALESCE(u.account_status, u.status, \'active\') = ?');
                params.push(status);
            }

            // Role filter
            if (role && ['admin', 'user'].includes(role)) {
                whereClauses.push('u.role = ?');
                params.push(role);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM users u
                ${whereClause}
            `;
            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // Get users with login stats
            const dataQuery = `
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    COALESCE(u.account_status, u.status, 'active') as account_status,
                    u.profile_photo,
                    u.created_at,
                    u.last_login,
                    COUNT(DISTINCT ll.id) as total_logins
                FROM users u
                LEFT JOIN login_logs ll ON u.id = ll.user_id
                ${whereClause}
                GROUP BY u.id
                ORDER BY u.created_at DESC
                LIMIT ? OFFSET ?
            `;
            const [dataResult] = await db.execute(dataQuery, [...params, limit, offset]);

            return {
                success: true,
                data: dataResult,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('[AdminService] Error getting users with stats:', error);
            throw error;
        }
    },

    /**
     * Get user status breakdown - for users page filter dropdown
     * Uses the same COALESCE logic as getStats() for consistency
     */
    async getUserStatusBreakdown() {
        try {
            const query = `
                SELECT
                    COALESCE(account_status, status, 'active') as status,
                    COUNT(*) as count
                FROM users
                GROUP BY COALESCE(account_status, status, 'active')
            `;
            const [result] = await db.execute(query);

            const breakdown = {
                active: 0,
                inactive: 0,
                suspended: 0
            };

            result.forEach(row => {
                if (row.status === 'active') breakdown.active = row.count;
                else if (row.status === 'inactive') breakdown.inactive = row.count;
                else if (row.status === 'suspended' || row.status === 'banned') breakdown.suspended = row.count;
            });

            return breakdown;
        } catch (error) {
            console.error('[AdminService] Error getting status breakdown:', error);
            throw error;
        }
    },

    /**
     * Get recent registrations (for dashboard)
     */
    async getRecentRegistrations(limit = 5) {
        try {
            const query = `
                SELECT
                    id,
                    name,
                    email,
                    role,
                    COALESCE(account_status, status, 'active') as account_status,
                    created_at
                FROM users
                ORDER BY created_at DESC
                LIMIT ?
            `;
            const [result] = await db.execute(query, [limit]);
            return result;
        } catch (error) {
            console.error('[AdminService] Error getting recent registrations:', error);
            throw error;
        }
    },

    /**
     * Get most active users (by login count)
     */
    async getMostActiveUsers(limit = 5) {
        try {
            const query = `
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    COALESCE(u.account_status, u.status, 'active') as account_status,
                    COUNT(ll.id) as total_logins,
                    MAX(ll.login_time) as last_login
                FROM users u
                LEFT JOIN login_logs ll ON u.id = ll.user_id
                GROUP BY u.id
                ORDER BY total_logins DESC
                LIMIT ?
            `;
            const [result] = await db.execute(query, [limit]);
            return result;
        } catch (error) {
            console.error('[AdminService] Error getting most active users:', error);
            throw error;
        }
    }
};

module.exports = adminService;
