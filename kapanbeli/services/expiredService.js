/**
 * Admin Expired Items Service
 * Monitoring bahan kadaluarsa dan laporan pemborosan
 */

const db = require('../config/database');

const expiredService = {
    /**
     * Get all expired items from all users
     */
    async getExpiredItems(options = {}) {
        try {
            const { page = 1, limit = 20, search = '', category = '' } = options;
            const offset = (page - 1) * limit;

            const whereClauses = ['p.expiry_date IS NOT NULL', 'p.expiry_date < CURDATE()'];
            const params = [];

            if (search) {
                whereClauses.push('(p.name LIKE ? OR u.name LIKE ? OR u.email LIKE ?)');
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (category) {
                whereClauses.push('c.name = ?');
                params.push(category);
            }

            const whereClause = whereClauses.join(' AND ');

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.user_id = u.id
                WHERE ${whereClause}
            `;
            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // Get expired items with user info
            const dataQuery = `
                SELECT
                    p.id, p.name, p.stock_quantity, p.unit, p.expiry_date, p.created_at,
                    DATEDIFF(CURDATE(), p.expiry_date) as days_expired,
                    DATEDIFF(p.expiry_date, p.created_at) as shelf_life_days,
                    c.name as category_name, c.id as category_id,
                    u.id as user_id, u.name as user_name, u.email as user_email,
                    CASE WHEN p.is_deactivated_by_admin = 1 THEN 'Dinonaktifkan Admin' ELSE 'Aktif' END as status
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.user_id = u.id
                WHERE ${whereClause}
                ORDER BY p.expiry_date ASC
                LIMIT ? OFFSET ?
            `;
            const [dataResult] = await db.execute(dataQuery, [...params, limit, offset]);

            // Get all categories for filter (not just expired ones)
            const [catResult] = await db.execute(`
                SELECT id, name FROM categories ORDER BY name
            `);

            return {
                success: true,
                data: dataResult,
                categories: catResult.map(c => c.name),
                pagination: {
                    total, page: parseInt(page), limit: parseInt(limit),
                    totalPages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('[expiredService.getExpiredItems] Error:', error);
            throw error;
        }
    },

    /**
     * Get wastage statistics
     */
    async getWastageStats() {
        try {
            const [stats] = await db.execute(`
                SELECT
                    COUNT(*) as total_expired_items,
                    COUNT(DISTINCT p.user_id) as affected_users,
                    AVG(DATEDIFF(p.expiry_date, p.created_at)) as avg_shelf_life,
                    SUM(p.stock_quantity) as total_expired_quantity,
                    c.name as category_name,
                    COUNT(*) as category_count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.expiry_date IS NOT NULL AND p.expiry_date < CURDATE()
                GROUP BY c.name
                ORDER BY category_count DESC
                LIMIT 10
            `);

            return { success: true, data: stats };
        } catch (error) {
            console.error('[expiredService.getWastageStats] Error:', error);
            throw error;
        }
    },

    /**
     * Get expiring soon items (within 7 days)
     */
    async getExpiringSoon() {
        try {
            const [items] = await db.execute(`
                SELECT
                    p.id, p.name, p.stock_quantity, p.unit, p.expiry_date,
                    DATEDIFF(p.expiry_date, CURDATE()) as days_until_expiry,
                    c.name as category_name,
                    u.name as user_name,
                    u.email as user_email
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.user_id = u.id
                WHERE p.expiry_date IS NOT NULL
                AND p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                ORDER BY p.expiry_date ASC
                LIMIT 50
            `);

            return { success: true, data: items };
        } catch (error) {
            console.error('[expiredService.getExpiringSoon] Error:', error);
            throw error;
        }
    }
};

module.exports = expiredService;
