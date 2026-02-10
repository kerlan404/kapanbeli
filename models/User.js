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
    create: async ({ name, email, password }) => {
        const query = 'INSERT INTO users (name, email, password, is_confirmed, created_at) VALUES (?, ?, ?, TRUE, NOW())';
        const [result] = await db.execute(query, [name, email, password]);

        // Kembalikan data pengguna yang baru dibuat
        return {
            id: result.insertId,
            name,
            email,
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
    }
};

module.exports = User;