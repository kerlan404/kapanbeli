/**
 * Admin Product Service
 * Service layer untuk mengelola produk semua user di admin panel
 * Production-ready dengan search, filter, dan pagination
 */

const db = require('../config/database');

const adminProductService = {
    /**
     * Get all products with pagination, search, and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated products
     */
    async getProducts(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                category = '',
                stockStatus = '', // all, low, out, good
                expiryStatus = '', // all, soon, expired
                isActive = '', // all, active, inactive
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const validSortColumns = ['id', 'name', 'stock_quantity', 'created_at', 'updated_at', 'expiry_date'];
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Build WHERE clause
            const whereClauses = [];
            const params = [];

            // Search filter (product name, user name/email, or category)
            if (search) {
                whereClauses.push('(p.name LIKE ? OR u.name LIKE ? OR u.email LIKE ? OR p.category LIKE ?)');
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            // Stock status filter
            if (stockStatus) {
                if (stockStatus === 'low') {
                    whereClauses.push('p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level');
                } else if (stockStatus === 'out') {
                    whereClauses.push('p.stock_quantity <= 0');
                } else if (stockStatus === 'good') {
                    whereClauses.push('p.stock_quantity > p.min_stock_level');
                }
            }

            // Expiry status filter
            if (expiryStatus) {
                if (expiryStatus === 'soon') {
                    whereClauses.push('p.expiry_date IS NOT NULL AND p.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)');
                } else if (expiryStatus === 'expired') {
                    whereClauses.push('p.expiry_date IS NOT NULL AND p.expiry_date < CURDATE()');
                }
            }

            // Active/Inactive filter
            if (isActive !== '' && isActive !== 'all') {
                whereClauses.push('p.is_active = ?');
                params.push(isActive === 'active' ? 1 : 0);
            }

            // Category filter
            if (category) {
                whereClauses.push('p.category = ?');
                params.push(category);
            }

            const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            // Get total count
            const countQuery = `
                SELECT COUNT(*) as total
                FROM products p
                JOIN users u ON p.user_id = u.id
                ${whereClause}
            `;

            const [countResult] = await db.execute(countQuery, params);
            const total = countResult[0].total;

            // Get products with user info
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
                    u.id as user_id,
                    u.name as user_name,
                    u.email as user_email,
                    CASE 
                        WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                        WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
                        ELSE 'good'
                    END as stock_status
                FROM products p
                JOIN users u ON p.user_id = u.id
                ${whereClause}
                ORDER BY p.${sortColumn} ${order}
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
            console.error('[adminProductService.getProducts] Error:', error);
            throw error;
        }
    },

    /**
     * Get product by ID with user info
     * @param {number} productId - Product ID
     * @returns {Promise<Object|null>} Product data
     */
    async getProductById(productId) {
        try {
            const query = `
                SELECT 
                    p.*,
                    u.id as user_id,
                    u.name as user_name,
                    u.email as user_email
                FROM products p
                JOIN users u ON p.user_id = u.id
                WHERE p.id = ?
            `;

            const [result] = await db.execute(query, [productId]);

            if (result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            console.error('[adminProductService.getProductById] Error:', error);
            throw error;
        }
    },

    /**
     * Update product
     * @param {number} productId - Product ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(productId, updateData) {
        try {
            // Check if product exists
            const existingProduct = await this.getProductById(productId);
            if (!existingProduct) {
                throw new Error('Produk tidak ditemukan');
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            const allowedFields = ['name', 'description', 'stock_quantity', 'min_stock_level', 'unit', 'expiry_date', 'category'];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    updates.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }

            if (updates.length === 0) {
                throw new Error('Tidak ada data yang diupdate');
            }

            updates.push('updated_at = NOW()');
            values.push(productId);

            const query = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
            await db.execute(query, values);

            // Get updated product
            const product = await this.getProductById(productId);

            return {
                success: true,
                data: product,
                message: 'Produk berhasil diupdate'
            };
        } catch (error) {
            console.error('[adminProductService.updateProduct] Error:', error);
            throw error;
        }
    },

    /**
     * Delete product
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} Result
     */
    async deleteProduct(productId) {
        try {
            // Check if product exists
            const product = await this.getProductById(productId);
            if (!product) {
                throw new Error('Produk tidak ditemukan');
            }

            // Delete product
            const query = 'DELETE FROM products WHERE id = ?';
            await db.execute(query, [productId]);

            return {
                success: true,
                message: 'Produk berhasil dihapus'
            };
        } catch (error) {
            console.error('[adminProductService.deleteProduct] Error:', error);
            throw error;
        }
    },

    /**
     * Toggle product active/inactive status
     * @param {number} productId - Product ID
     * @returns {Promise<Object>} Result
     */
    async toggleStatus(productId) {
        try {
            // Check if product exists
            const product = await this.getProductById(productId);
            if (!product) {
                throw new Error('Produk tidak ditemukan');
            }

            // Toggle status
            const newStatus = product.is_active ? 0 : 1;
            const query = 'UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?';
            await db.execute(query, [newStatus, productId]);

            return {
                success: true,
                data: { is_active: newStatus },
                message: newStatus ? 'Produk diaktifkan' : 'Produk dinonaktifkan'
            };
        } catch (error) {
            console.error('[adminProductService.toggleStatus] Error:', error);
            throw error;
        }
    },

    /**
     * Get product statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_products,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
                    SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock,
                    SUM(CASE WHEN stock_quantity > min_stock_level THEN 1 ELSE 0 END) as good_stock,
                    AVG(stock_quantity) as avg_stock
                FROM products
            `;

            const [result] = await db.execute(query);
            return result[0];
        } catch (error) {
            console.error('[adminProductService.getStatistics] Error:', error);
            throw error;
        }
    },

    /**
     * Get categories (distinct)
     * @returns {Promise<Array>} Categories
     */
    async getCategories() {
        try {
            const query = `
                SELECT DISTINCT category 
                FROM products 
                WHERE category IS NOT NULL AND category != ''
                ORDER BY category
            `;

            const [result] = await db.execute(query);
            return result.map(row => row.category);
        } catch (error) {
            console.error('[adminProductService.getCategories] Error:', error);
            return [];
        }
    }
};

module.exports = adminProductService;
