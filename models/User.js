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
    }
};

module.exports = User;