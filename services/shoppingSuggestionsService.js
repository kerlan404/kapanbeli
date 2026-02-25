/**
 * Shopping Suggestions Service
 * Service untuk menampilkan saran pembelian berdasarkan stok dan kadaluarsa
 */

const db = require('../config/database');

const shoppingSuggestionsService = {
    /**
     * Get shopping suggestions - products that need to be restocked
     * @param {object} options - Query options
     * @returns {Promise<object>} Products needing restock
     */
    async getSuggestions(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                status = '' // all, out_of_stock, low_stock, expiring
            } = options;

            const offset = (page - 1) * limit;

            // Build WHERE clause
            const whereClauses = ['p.is_active = 1'];
            const params = [];

            // Search filter
            if (search) {
                whereClauses.push('(p.name LIKE ? OR p.category LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            // Status filter
            if (status) {
                if (status === 'out_of_stock') {
                    whereClauses.push('p.stock_quantity <= 0');
                } else if (status === 'low_stock') {
                    whereClauses.push('p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level');
                } else if (status === 'expiring') {
                    whereClauses.push('p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
                }
            } else {
                // Default: show out of stock OR low stock OR expiring soon
                whereClauses.push(`(
                    p.stock_quantity <= 0 OR 
                    (p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level) OR
                    (p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY))
                )`);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM products p
                ${whereClause}
            `;

            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // Get products with priority ordering
            const dataQuery = `
                SELECT
                    p.id,
                    p.name,
                    p.description,
                    p.stock_quantity,
                    p.min_stock_level,
                    p.unit,
                    p.expiry_date,
                    p.category,
                    p.is_active,
                    p.created_at,
                    p.updated_at,
                    p.user_id,
                    p.image_url,
                    c.name as category_name,
                    u.name as user_name,
                    u.email as user_email,
                    CASE
                        WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                        WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
                        ELSE 'good'
                    END as stock_status,
                    CASE
                        WHEN p.expiry_date IS NOT NULL AND p.expiry_date < CURDATE() THEN 'expired'
                        WHEN p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'expiring_very_soon'
                        WHEN p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
                        ELSE 'good'
                    END as expiry_status,
                    CASE
                        WHEN p.stock_quantity <= 0 THEN 1
                        WHEN p.stock_quantity <= p.min_stock_level THEN 2
                        WHEN p.expiry_date IS NOT NULL AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 3
                        ELSE 4
                    END as priority
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.user_id = u.id
                ${whereClause}
                ORDER BY priority ASC, p.name ASC
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
            console.error('[shoppingSuggestionsService.getSuggestions] Error:', error);
            throw error;
        }
    },

    /**
     * Get shopping suggestions statistics
     * @returns {Promise<object>} Statistics
     */
    async getStatistics() {
        try {
            const query = `
                SELECT
                    COUNT(*) as total_products,
                    SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock,
                    SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as expiring_soon,
                    SUM(CASE WHEN expiry_date IS NOT NULL AND expiry_date < CURDATE() THEN 1 ELSE 0 END) as expired
                FROM products
                WHERE is_active = 1
            `;

            const [result] = await db.execute(query);
            return result[0];
        } catch (error) {
            console.error('[shoppingSuggestionsService.getStatistics] Error:', error);
            throw error;
        }
    }
};

module.exports = shoppingSuggestionsService;
