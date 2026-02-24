const db = require('../config/database');

const User = {
    // Fungsi untuk mencari pengguna berdasarkan email
    findByEmail: async (email) => {
        try {
            const query = 'SELECT * FROM users WHERE email = ?';
            const [rows] = await db.execute(query, [email]);

            if (rows.length === 0) {
                return null;
            }

            // Jika kolom is_confirmed tidak ada, tambahkan nilai default
            const user = rows[0];
            if (typeof user.is_confirmed === 'undefined') {
                user.is_confirmed = true; // Asumsikan user dikonfirmasi jika kolom tidak ada
            }
            
            // Jika kolom role tidak ada, tambahkan nilai default
            if (typeof user.role === 'undefined') {
                user.role = 'user'; // Asumsikan user biasa jika kolom tidak ada
            }

            return user;
        } catch (error) {
            // Jika ada error karena kolom tidak ditemukan, coba query tanpa kolom tersebut
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in users table, querying with basic fields');
                const query = 'SELECT id, name, email, password, created_at FROM users WHERE email = ?';
                const [rows] = await db.execute(query, [email]);

                if (rows.length === 0) {
                    return null;
                }

                // Tambahkan nilai default untuk kolom yang mungkin tidak ada
                const user = rows[0];
                user.is_confirmed = true; // Asumsikan user dikonfirmasi
                user.role = 'user'; // Asumsikan user biasa

                return user;
            }
            throw error;
        }
    },

    // Fungsi untuk mencari pengguna berdasarkan ID
    findById: async (id) => {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const [rows] = await db.execute(query, [id]);

            if (rows.length === 0) {
                return null;
            }

            // Jika kolom is_confirmed tidak ada, tambahkan nilai default
            const user = rows[0];
            if (typeof user.is_confirmed === 'undefined') {
                user.is_confirmed = true; // Asumsikan user dikonfirmasi jika kolom tidak ada
            }
            
            // Jika kolom role tidak ada, tambahkan nilai default
            if (typeof user.role === 'undefined') {
                user.role = 'user'; // Asumsikan user biasa jika kolom tidak ada
            }

            return user;
        } catch (error) {
            // Jika ada error karena kolom tidak ditemukan, coba query tanpa kolom tersebut
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in users table, querying with basic fields');
                const query = 'SELECT id, name, email, password, created_at FROM users WHERE id = ?';
                const [rows] = await db.execute(query, [id]);

                if (rows.length === 0) {
                    return null;
                }

                // Tambahkan nilai default untuk kolom yang mungkin tidak ada
                const user = rows[0];
                user.is_confirmed = true; // Asumsikan user dikonfirmasi
                user.role = 'user'; // Asumsikan user biasa

                return user;
            }
            throw error;
        }
    },

    // Fungsi untuk mencari pengguna berdasarkan confirmation token
    // (Tidak digunakan lagi sejak implementasi auto-login setelah registrasi)
    findByConfirmationToken: async (token) => {
        // Karena kolom confirmation_token mungkin tidak ada, kita hanya mengembalikan null
        // atau bisa juga menyesuaikan dengan struktur tabel yang sebenarnya
        try {
            const query = 'SELECT * FROM users WHERE confirmation_token = ?';
            const [rows] = await db.execute(query, [token]);
    
            if (rows.length === 0) {
                return null;
            }
    
            return rows[0];
        } catch (error) {
            // Jika kolom confirmation_token tidak ada, kembalikan null
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Column confirmation_token does not exist in users table');
                return null;
            }
            throw error;
        }
    },

    // Fungsi untuk membuat pengguna baru
    create: async ({ name, email, password, role = 'user' }) => {
        const query = 'INSERT INTO users (name, email, password, role, is_confirmed, created_at) VALUES (?, ?, ?, ?, TRUE, NOW())';
        const [result] = await db.execute(query, [name, email, password, role]);

        // Kembalikan data pengguna yang baru dibuat
        return {
            id: result.insertId,
            name,
            email,
            role,
            is_confirmed: true, // Langsung dikonfirmasi
            created_at: new Date()
        };
    },

    // Fungsi untuk memperbarui informasi pengguna
    update: async (id, { name, email }) => {
        const query = 'UPDATE users SET name = ?, email = ? WHERE id = ?';
        const [result] = await db.execute(query, [name, email, id]);

        if (result.affectedRows === 0) {
            throw new Error('User tidak ditemukan');
        }

        return { id, name, email };
    },

    // Fungsi untuk menghapus pengguna
    delete: async (id) => {
        const query = 'DELETE FROM users WHERE id = ?';
        const [result] = await db.execute(query, [id]);

        if (result.affectedRows === 0) {
            throw new Error('User tidak ditemukan');
        }

        return { id };
    },

    // Fungsi untuk menandai pengguna sebagai dikonfirmasi
    // (Tidak digunakan lagi sejar implementasi auto-login setelah registrasi)
    confirmUser: async (confirmationToken) => {
        try {
            const query = 'UPDATE users SET is_confirmed = TRUE, confirmation_token = NULL WHERE confirmation_token = ?';
            const [result] = await db.execute(query, [confirmationToken]);

            if (result.affectedRows === 0) {
                throw new Error('Invalid confirmation token');
            }

            return { success: true };
        } catch (error) {
            // Jika kolom tidak ada, tangani error
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Column is_confirmed or confirmation_token does not exist in users table');
                // Kita abaikan operasi konfirmasi jika kolom tidak ada
                return { success: true };
            }
            throw error;
        }
    },

    // Fungsi untuk mengecek apakah pengguna sudah dikonfirmasi
    isConfirmed: async (id) => {
        try {
            const query = 'SELECT is_confirmed FROM users WHERE id = ?';
            const [rows] = await db.execute(query, [id]);

            if (rows.length === 0) {
                return null; // User not found
            }

            return rows[0].is_confirmed;
        } catch (error) {
            // Jika kolom is_confirmed tidak ada, asumsikan pengguna dikonfirmasi
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Column is_confirmed does not exist in users table, assuming user is confirmed');
                return true;
            }
            throw error;
        }
    },

    // Fungsi untuk mendapatkan semua pengguna
    getAllUsers: async () => {
        try {
            const query = 'SELECT id, name, email, created_at, is_confirmed FROM users ORDER BY created_at DESC';
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            // Jika kolom is_confirmed tidak ada, coba query tanpa kolom tersebut
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Column is_confirmed does not exist in users table, querying without it');
                const query = 'SELECT id, name, email, created_at FROM users ORDER BY created_at DESC';
                const [rows] = await db.execute(query);
                // Tambahkan nilai default untuk is_confirmed
                return rows.map(user => ({ ...user, is_confirmed: true }));
            }
            console.error('Error getting all users:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan total jumlah pengguna
    getTotalUsers: async () => {
        try {
            const query = 'SELECT COUNT(*) as count FROM users';
            const [rows] = await db.execute(query);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting total users:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan jumlah pengguna aktif
    getActiveUsers: async () => {
        try {
            // Dalam implementasi nyata, ini akan memeriksa pengguna yang login dalam periode tertentu
            // Untuk saat ini, kita asumsikan semua pengguna sebagai aktif
            const query = 'SELECT COUNT(*) as count FROM users';
            const [rows] = await db.execute(query);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting active users:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan pengguna berdasarkan email (alias untuk findByEmail)
    getByEmail: async (email) => {
        return await User.findByEmail(email);
    },

    // Fungsi untuk mendapatkan pengguna berdasarkan ID (alias untuk findById)
    getById: async (id) => {
        return await User.findById(id);
    },

    // Fungsi untuk memperbarui token reset password
    updatePasswordResetToken: async (userId, token) => {
        try {
            // Cek apakah kolom password_reset_token ada di tabel
            const checkColumnQuery = `
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'users' 
                AND COLUMN_NAME = 'password_reset_token'
            `;
            const [columns] = await db.execute(checkColumnQuery);

            if (columns.length === 0) {
                // Jika kolom tidak ada, tambahkan kolom tersebut
                const addColumnQuery = `
                    ALTER TABLE users 
                    ADD COLUMN password_reset_token VARCHAR(255) NULL,
                    ADD COLUMN password_reset_expires DATETIME NULL
                `;
                await db.execute(addColumnQuery);
            }

            // Update token reset password
            const updateQuery = `
                UPDATE users 
                SET password_reset_token = ?, 
                    password_reset_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR)
                WHERE id = ?
            `;
            await db.execute(updateQuery, [token, userId]);
        } catch (error) {
            console.error('Error updating password reset token:', error);
            throw error;
        }
    },

    // Fungsi untuk memperbarui password pengguna
    updatePassword: async (userId, newPasswordHash) => {
        try {
            const query = 'UPDATE users SET password = ? WHERE id = ?';
            await db.execute(query, [newPasswordHash, userId]);
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    },

    // Fungsi untuk track login user
    trackLogin: async (userId, ipAddress, sessionId = null, userAgent = null) => {
        try {
            // Update user last login
            const updateQuery = `
                UPDATE users 
                SET last_login = NOW(), 
                    last_ip = ?, 
                    login_count = login_count + 1,
                    status = 'active'
                WHERE id = ?
            `;
            await db.execute(updateQuery, [ipAddress, userId]);

            // Insert login log
            const logQuery = `
                INSERT INTO login_logs (user_id, login_time, ip_address, session_id, user_agent, created_at)
                VALUES (?, NOW(), ?, ?, ?, NOW())
            `;
            const [result] = await db.execute(logQuery, [userId, ipAddress, sessionId, userAgent]);

            // Update user stats
            await User.updateUserStats(userId, { total_logins: 'increment' });

            return { success: true, logId: result.insertId };
        } catch (error) {
            console.error('Error tracking login:', error);
            throw error;
        }
    },

    // Fungsi untuk track logout user
    trackLogout: async (userId, sessionId = null) => {
        try {
            // Update user last logout
            const updateQuery = 'UPDATE users SET last_logout = NOW() WHERE id = ?';
            await db.execute(updateQuery, [userId]);

            // Update login log with logout time
            const logQuery = `
                UPDATE login_logs 
                SET logout_time = NOW() 
                WHERE user_id = ? AND session_id = ? AND logout_time IS NULL
                ORDER BY login_time DESC 
                LIMIT 1
            `;
            await db.execute(logQuery, [userId, sessionId]);

            // Update user stats
            await User.updateUserStats(userId, { last_activity: new Date() });

            return { success: true };
        } catch (error) {
            console.error('Error tracking logout:', error);
            throw error;
        }
    },

    // Fungsi untuk ban user
    banUser: async (userId, reason, bannedBy) => {
        try {
            const query = `
                UPDATE users 
                SET is_banned = TRUE, 
                    ban_reason = ?, 
                    banned_by = ?, 
                    banned_at = NOW(),
                    status = 'banned'
                WHERE id = ?
            `;
            await db.execute(query, [reason, bannedBy, userId]);
            return { success: true };
        } catch (error) {
            console.error('Error banning user:', error);
            throw error;
        }
    },

    // Fungsi untuk unban user
    unbanUser: async (userId) => {
        try {
            const query = `
                UPDATE users 
                SET is_banned = FALSE, 
                    ban_reason = NULL, 
                    banned_by = NULL, 
                    banned_at = NULL,
                    status = 'active'
                WHERE id = ?
            `;
            await db.execute(query, [userId]);
            return { success: true };
        } catch (error) {
            console.error('Error unbanning user:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan semua users dengan info lengkap
    getAllUsersWithDetails: async () => {
        try {
            const query = `
                SELECT 
                    u.id, u.name, u.email, u.role, u.is_banned, u.ban_reason, 
                    u.banned_at, u.last_login, u.last_logout, u.login_count,
                    u.status, u.created_at,
                    COALESCE(s.total_products, 0) as total_products,
                    COALESCE(s.total_notes, 0) as total_notes
                FROM users u
                LEFT JOIN user_stats s ON u.id = s.user_id
                ORDER BY u.created_at DESC
            `;
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting all users with details:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan user by ID dengan detail lengkap
    findByIdWithDetails: async (id) => {
        try {
            const query = `
                SELECT 
                    u.*, 
                    COALESCE(s.total_products, 0) as total_products,
                    COALESCE(s.total_notes, 0) as total_notes,
                    COALESCE(s.total_logins, 0) as total_logins
                FROM users u
                LEFT JOIN user_stats s ON u.id = s.user_id
                WHERE u.id = ?
            `;
            const [rows] = await db.execute(query, [id]);

            if (rows.length === 0) {
                return null;
            }

            return rows[0];
        } catch (error) {
            console.error('Error finding user by ID with details:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan login logs user
    getLoginLogs: async (userId, limit = 50) => {
        try {
            const query = `
                SELECT * FROM login_logs 
                WHERE user_id = ? 
                ORDER BY login_time DESC 
                LIMIT ?
            `;
            const [rows] = await db.execute(query, [userId, limit]);
            return rows;
        } catch (error) {
            console.error('Error getting login logs:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan semua login logs
    getAllLoginLogs: async (limit = 100) => {
        try {
            const query = `
                SELECT 
                    ll.*, 
                    u.name as user_name, 
                    u.email as user_email
                FROM login_logs ll
                LEFT JOIN users u ON ll.user_id = u.id
                ORDER BY ll.login_time DESC 
                LIMIT ?
            `;
            const [rows] = await db.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Error getting all login logs:', error);
            throw error;
        }
    },

    // Fungsi untuk update user stats
    updateUserStats: async (userId, stats) => {
        try {
            // Check if stats record exists
            const [existing] = await db.execute('SELECT id FROM user_stats WHERE user_id = ?', [userId]);

            if (existing.length === 0) {
                // Create new stats record
                const insertQuery = `
                    INSERT INTO user_stats (user_id, total_products, total_notes, total_logins, created_at, updated_at)
                    VALUES (?, 0, 0, 0, NOW(), NOW())
                `;
                await db.execute(insertQuery, [userId]);
            }

            // Build update query dynamically
            const updates = [];
            const values = [];

            for (const [key, value] of Object.entries(stats)) {
                if (value === 'increment') {
                    updates.push(`${key} = ${key} + 1`);
                } else if (value === 'decrement') {
                    updates.push(`${key} = GREATEST(0, ${key} - 1)`); // Prevent negative values
                } else {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            }

            if (updates.length > 0) {
                values.push(userId);
                const updateQuery = `
                    UPDATE user_stats
                    SET ${updates.join(', ')}, updated_at = NOW()
                    WHERE user_id = ?
                `;
                await db.execute(updateQuery, values);
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan statistik untuk dashboard admin
    getDashboardStats: async () => {
        try {
            const stats = {};

            // Total users
            const [totalUsersResult] = await db.execute('SELECT COUNT(*) as count FROM users');
            stats.totalUsers = totalUsersResult[0].count;

            // Active users
            const [activeUsersResult] = await db.execute("SELECT COUNT(*) as count FROM users WHERE status = 'active'");
            stats.activeUsers = activeUsersResult[0].count;

            // Banned users
            const [bannedUsersResult] = await db.execute("SELECT COUNT(*) as count FROM users WHERE status = 'banned'");
            stats.bannedUsers = bannedUsersResult[0].count;

            // Total products - direct count from products table for accuracy
            const [totalProductsResult] = await db.execute('SELECT COUNT(*) as count FROM products');
            stats.totalProducts = totalProductsResult[0].count;

            // Total notes - direct count from notes table for accuracy
            const [totalNotesResult] = await db.execute('SELECT COUNT(*) as count FROM notes');
            stats.totalNotes = totalNotesResult[0].count;

            // Users online today (logged in today)
            const [onlineTodayResult] = await db.execute(
                "SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_time) = CURDATE()"
            );
            stats.usersOnlineToday = onlineTodayResult[0].count;

            // Low stock items - count products where stock_quantity <= min_stock_level
            const [lowStockResult] = await db.execute(
                'SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level AND stock_quantity > 0'
            );
            stats.lowStockItems = lowStockResult[0].count || 0;

            // Products by category
            const [productsByCategoryResult] = await db.execute(`
                SELECT c.name as category, COUNT(p.id) as count
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                GROUP BY c.id, c.name
                ORDER BY count DESC
            `);
            stats.productsByCategory = productsByCategoryResult;

            // Products by user (top 10)
            const [productsByUserResult] = await db.execute(`
                SELECT u.name, u.email, COUNT(p.id) as product_count
                FROM users u
                LEFT JOIN products p ON u.id = p.user_id
                GROUP BY u.id, u.name, u.email
                ORDER BY product_count DESC
                LIMIT 10
            `);
            stats.productsByUser = productsByUserResult;

            // Login activity (last 7 days)
            const [loginActivityResult] = await db.execute(`
                SELECT DATE(login_time) as date, COUNT(*) as count
                FROM login_logs
                WHERE login_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(login_time)
                ORDER BY date ASC
            `);
            stats.loginActivity = loginActivityResult;

            return stats;
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    }
};

module.exports = User;