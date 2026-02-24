/**
 * User Service
 * Reusable business logic for user management
 * All database operations related to users should go through this service
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');

const userService = {
    // ============================================
    // CREATE OPERATIONS
    // ============================================

    /**
     * Create new user
     * @param {Object} userData - User data
     * @returns {Promise<Object>} Created user
     */
    async createUser(userData) {
        try {
            const { name, email, password, role = 'user', account_status = 'active' } = userData;

            // Check if email already exists
            const existingUser = await this.findByEmail(email);
            if (existingUser) {
                throw new Error('Email sudah terdaftar');
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insert user
            const query = `
                INSERT INTO users (name, email, password, role, account_status, created_at)
                VALUES (?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await db.execute(query, [
                name,
                email,
                hashedPassword,
                role,
                account_status
            ]);

            // Get created user
            const user = await this.findById(result.insertId);
            
            return {
                success: true,
                data: user,
                message: 'User berhasil dibuat'
            };
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },

    // ============================================
    // READ OPERATIONS
    // ============================================

    /**
     * Get users with pagination, search, and filters
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Paginated users
     */
    async getUsers(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                status = '',
                role = '',
                sortBy = 'created_at',
                sortOrder = 'DESC'
            } = options;

            const offset = (page - 1) * limit;
            const validSortColumns = ['id', 'name', 'email', 'created_at', 'last_login'];
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
            const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

            // Build WHERE clause
            const whereClauses = [];
            const params = [];

            // Search filter (name or email)
            if (search) {
                whereClauses.push('(u.name LIKE ? OR u.email LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }

            // Status filter
            if (status && ['active', 'inactive', 'suspended'].includes(status)) {
                whereClauses.push('u.account_status = ?');
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
                    u.account_status,
                    u.profile_image,
                    u.created_at,
                    u.last_login,
                    COUNT(DISTINCT ll.id) as total_logins
                FROM users u
                LEFT JOIN login_logs ll ON u.id = ll.user_id
                ${whereClause}
                GROUP BY u.id
                ORDER BY u.${sortColumn} ${order}
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
            console.error('Error getting users:', error);
            throw error;
        }
    },

    /**
     * Get user by ID with statistics
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User data
     */
    async getUserById(userId) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    u.account_status,
                    u.profile_image,
                    u.created_at,
                    u.last_login,
                    COUNT(DISTINCT ll.id) as total_logins,
                    COUNT(DISTINCT p.id) as total_products,
                    COUNT(DISTINCT s.id) as total_suggestions,
                    COUNT(DISTINCT n.id) as total_notes
                FROM users u
                LEFT JOIN login_logs ll ON u.id = ll.user_id
                LEFT JOIN products p ON u.id = p.user_id
                LEFT JOIN suggestions s ON u.id = s.user_id
                LEFT JOIN notes n ON u.id = n.user_id
                WHERE u.id = ?
                GROUP BY u.id
            `;

            const [result] = await db.execute(query, [userId]);

            if (result.length === 0) {
                return null;
            }

            return result[0];
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    },

    /**
     * Find user by email
     * @param {string} email - User email
     * @returns {Promise<Object|null>} User data
     */
    async findByEmail(email) {
        try {
            const query = 'SELECT * FROM users WHERE email = ?';
            const [result] = await db.execute(query, [email]);
            return result[0] || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    },

    /**
     * Find user by ID
     * @param {number} id - User ID
     * @returns {Promise<Object|null>} User data
     */
    async findById(id) {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const [result] = await db.execute(query, [id]);
            return result[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    },

    /**
     * Get user's products
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Products list
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
            `;

            const [result] = await db.execute(query, [userId]);
            return result;
        } catch (error) {
            console.error('Error getting user products:', error);
            throw error;
        }
    },

    /**
     * Get user's suggestions
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Suggestions list
     */
    async getUserSuggestions(userId) {
        try {
            const query = `
                SELECT 
                    id,
                    name,
                    type,
                    description,
                    status,
                    created_at
                FROM suggestions
                WHERE user_id = ?
                ORDER BY created_at DESC
            `;

            const [result] = await db.execute(query, [userId]);
            return result;
        } catch (error) {
            console.error('Error getting user suggestions:', error);
            throw error;
        }
    },

    /**
     * Get user's notes
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Notes list
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
            `;

            const [result] = await db.execute(query, [userId]);
            return result;
        } catch (error) {
            console.error('Error getting user notes:', error);
            throw error;
        }
    },

    /**
     * Get user's login history
     * @param {number} userId - User ID
     * @param {number} limit - Limit results
     * @returns {Promise<Array>} Login logs
     */
    async getUserLoginHistory(userId, limit = 10) {
        try {
            const query = `
                SELECT 
                    id,
                    login_at,
                    ip_address,
                    user_agent
                FROM login_logs
                WHERE user_id = ?
                ORDER BY login_at DESC
                LIMIT ?
            `;

            const [result] = await db.execute(query, [userId, limit]);
            return result;
        } catch (error) {
            console.error('Error getting login history:', error);
            throw error;
        }
    },

    // ============================================
    // UPDATE OPERATIONS
    // ============================================

    /**
     * Update user
     * @param {number} userId - User ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object>} Updated user
     */
    async updateUser(userId, updateData) {
        try {
            const { name, email, role, account_status, profile_image } = updateData;

            // Check if user exists
            const existingUser = await this.findById(userId);
            if (!existingUser) {
                throw new Error('User tidak ditemukan');
            }

            // Check if email is already used by another user
            if (email && email !== existingUser.email) {
                const emailUser = await this.findByEmail(email);
                if (emailUser && emailUser.id !== userId) {
                    throw new Error('Email sudah digunakan oleh user lain');
                }
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            if (name) {
                updates.push('name = ?');
                values.push(name);
            }

            if (email) {
                updates.push('email = ?');
                values.push(email);
            }

            if (role) {
                updates.push('role = ?');
                values.push(role);
            }

            if (account_status) {
                updates.push('account_status = ?');
                values.push(account_status);
            }

            if (profile_image !== undefined) {
                updates.push('profile_image = ?');
                values.push(profile_image);
            }

            if (updates.length === 0) {
                throw new Error('Tidak ada data yang diupdate');
            }

            updates.push('updated_at = NOW()');
            values.push(userId);

            const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
            await db.execute(query, values);

            // Get updated user
            const user = await this.findById(userId);

            return {
                success: true,
                data: user,
                message: 'User berhasil diupdate'
            };
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    },

    /**
     * Update user password
     * @param {number} userId - User ID
     * @param {string} newPassword - New password
     * @returns {Promise<Object>} Result
     */
    async updatePassword(userId, newPassword) {
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const query = `
                UPDATE users 
                SET password = ?, updated_at = NOW()
                WHERE id = ?
            `;

            await db.execute(query, [hashedPassword, userId]);

            return {
                success: true,
                message: 'Password berhasil diupdate'
            };
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    /**
     * Update user profile image
     * @param {number} userId - User ID
     * @param {string} imagePath - Profile image path
     * @returns {Promise<Object>} Result
     */
    async updateProfileImage(userId, imagePath) {
        try {
            // Get old profile image
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // Delete old image if exists
            if (user.profile_image) {
                const fs = require('fs').promises;
                const path = require('path');
                const oldPath = path.join(__dirname, '..', user.profile_image);
                
                try {
                    await fs.access(oldPath);
                    await fs.unlink(oldPath);
                } catch (err) {
                    // File doesn't exist, ignore
                }
            }

            // Update database
            const query = `
                UPDATE users 
                SET profile_image = ?, updated_at = NOW()
                WHERE id = ?
            `;

            await db.execute(query, [imagePath, userId]);

            return {
                success: true,
                data: { profile_image: imagePath },
                message: 'Foto profil berhasil diupdate'
            };
        } catch (error) {
            console.error('Error updating profile image:', error);
            throw error;
        }
    },

    /**
     * Update last login timestamp
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Result
     */
    async updateLastLogin(userId) {
        try {
            const query = `
                UPDATE users 
                SET last_login = NOW()
                WHERE id = ?
            `;

            await db.execute(query, [userId]);

            return {
                success: true,
                message: 'Last login updated'
            };
        } catch (error) {
            console.error('Error updating last login:', error);
            throw error;
        }
    },

    // ============================================
    // DELETE OPERATIONS
    // ============================================

    /**
     * Soft delete user (set status to inactive)
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Result
     */
    async softDelete(userId) {
        try {
            const query = `
                UPDATE users 
                SET account_status = 'inactive', updated_at = NOW()
                WHERE id = ?
            `;

            await db.execute(query, [userId]);

            return {
                success: true,
                message: 'User berhasil dinonaktifkan'
            };
        } catch (error) {
            console.error('Error soft deleting user:', error);
            throw error;
        }
    },

    /**
     * Hard delete user (permanently delete)
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Result
     */
    async hardDelete(userId) {
        try {
            // Check if user exists
            const user = await this.findById(userId);
            if (!user) {
                throw new Error('User tidak ditemukan');
            }

            // Delete profile image if exists
            if (user.profile_image) {
                const fs = require('fs').promises;
                const path = require('path');
                const imagePath = path.join(__dirname, '..', user.profile_image);
                
                try {
                    await fs.access(imagePath);
                    await fs.unlink(imagePath);
                } catch (err) {
                    // File doesn't exist, ignore
                }
            }

            // Delete user (foreign keys will handle related data)
            const query = 'DELETE FROM users WHERE id = ?';
            await db.execute(query, [userId]);

            return {
                success: true,
                message: 'User berhasil dihapus permanen'
            };
        } catch (error) {
            console.error('Error hard deleting user:', error);
            throw error;
        }
    },

    // ============================================
    // STATISTICS
    // ============================================

    /**
     * Get user statistics
     * @returns {Promise<Object>} Statistics
     */
    async getStatistics() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_users,
                    SUM(CASE WHEN account_status = 'active' THEN 1 ELSE 0 END) as active_users,
                    SUM(CASE WHEN account_status = 'inactive' THEN 1 ELSE 0 END) as inactive_users,
                    SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
                    SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users
                FROM users
            `;

            const [result] = await db.execute(query);
            return result[0];
        } catch (error) {
            console.error('Error getting statistics:', error);
            throw error;
        }
    },

    /**
     * Get users by status count
     * @returns {Promise<Object>} Count by status
     */
    async getCountByStatus() {
        try {
            const query = `
                SELECT 
                    account_status,
                    COUNT(*) as count
                FROM users
                GROUP BY account_status
            `;

            const [result] = await db.execute(query);
            
            const stats = { active: 0, inactive: 0, suspended: 0 };
            result.forEach(row => {
                stats[row.account_status] = row.count;
            });

            return stats;
        } catch (error) {
            console.error('Error getting count by status:', error);
            throw error;
        }
    }
};

module.exports = userService;
