/**
 * User Profile Service
 * Service layer untuk mengelola data profil user
 * Clean, reusable, dan production-ready
 */

const db = require('../config/database');

const userProfileService = {
    /**
     * Get user statistics dari view v_user_statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object|null>} User statistics data
     */
    async getUserStatistics(userId) {
        try {
            const query = `
                SELECT * 
                FROM v_user_statistics 
                WHERE id = ?
            `;

            const [rows] = await db.execute(query, [userId]);

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            console.error('[userProfileService.getUserStatistics] Error:', error);
            throw error;
        }
    },

    /**
     * Get user activity logs
     * @param {number} userId - User ID
     * @param {number} limit - Max records to fetch (default: 10)
     * @returns {Promise<Array>} Activity logs
     */
    async getUserActivityLogs(userId, limit = 10) {
        try {
            const query = `
                SELECT 
                    al.id,
                    al.activity_type,
                    al.description,
                    al.ip_address,
                    al.created_at
                FROM activity_logs al
                WHERE al.user_id = ?
                ORDER BY al.created_at DESC
                LIMIT ?
            `;

            const [rows] = await db.execute(query, [userId, limit]);

            return rows;
        } catch (error) {
            // Handle case where activity_logs table doesn't exist yet
            if (error.code === 'ER_NO_SUCH_TABLE') {
                console.warn('[userProfileService.getUserActivityLogs] activity_logs table not found');
                return [];
            }

            console.error('[userProfileService.getUserActivityLogs] Error:', error);
            throw error;
        }
    },

    /**
     * Get user's products with statistics
     * @param {number} userId - User ID
     * @returns {Promise<Array>} User's products
     */
    async getUserProducts(userId) {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    stock_quantity,
                    unit,
                    min_stock_level,
                    expiry_date,
                    created_at,
                    updated_at
                FROM products
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 20
            `;

            const [rows] = await db.execute(query, [userId]);

            return rows;
        } catch (error) {
            console.error('[userProfileService.getUserProducts] Error:', error);
            throw error;
        }
    },

    /**
     * Get user's suggestions
     * @param {number} userId - User ID
     * @returns {Promise<Array>} User's suggestions
     */
    async getUserSuggestions(userId) {
        try {
            const query = `
                SELECT 
                    id,
                    content as name,
                    'suggestion' as type,
                    content as description,
                    'pending' as status,
                    created_at
                FROM suggestions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 20
            `;

            const [rows] = await db.execute(query, [userId]);

            return rows;
        } catch (error) {
            console.error('[userProfileService.getUserSuggestions] Error:', error);
            throw error;
        }
    },

    /**
     * Get user's notes
     * @param {number} userId - User ID
     * @returns {Promise<Array>} User's notes
     */
    async getUserNotes(userId) {
        try {
            const query = `
                SELECT 
                    id,
                    title,
                    content,
                    created_at,
                    updated_at
                FROM notes
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 20
            `;

            const [rows] = await db.execute(query, [userId]);

            return rows;
        } catch (error) {
            console.error('[userProfileService.getUserNotes] Error:', error);
            throw error;
        }
    },

    /**
     * Get complete user profile data
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Complete user profile with all related data
     */
    async getCompleteUserProfile(userId) {
        try {
            // Get user statistics (includes basic info + stats)
            const userStats = await this.getUserStatistics(userId);

            if (!userStats) {
                return null;
            }

            // Get all related data in parallel for better performance
            const [activityLogs, products, suggestions, notes] = await Promise.all([
                this.getUserActivityLogs(userId, 10),
                this.getUserProducts(userId),
                this.getUserSuggestions(userId),
                this.getUserNotes(userId)
            ]);

            return {
                user: userStats,
                activityLogs,
                products,
                suggestions,
                notes,
                summary: {
                    totalProducts: products.length,
                    totalSuggestions: suggestions.length,
                    totalNotes: notes.length,
                    totalActivities: activityLogs.length
                }
            };
        } catch (error) {
            console.error('[userProfileService.getCompleteUserProfile] Error:', error);
            throw error;
        }
    }
};

module.exports = userProfileService;
