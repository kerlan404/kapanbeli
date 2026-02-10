const db = require('../config/database');

const User = {
    // Fungsi untuk mencari pengguna berdasarkan email
    findByEmail: async (email) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        const [rows] = await db.execute(query, [email]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk mencari pengguna berdasarkan ID
    findById: async (id) => {
        const query = 'SELECT * FROM users WHERE id = ?';
        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk mencari pengguna berdasarkan confirmation token
    findByConfirmationToken: async (token) => {
        const query = 'SELECT * FROM users WHERE confirmation_token = ?';
        const [rows] = await db.execute(query, [token]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk membuat pengguna baru
    create: async ({ name, email, password }) => {
        // Generate a random confirmation token
        const crypto = require('crypto');
        const confirmationToken = crypto.randomBytes(32).toString('hex');

        const query = 'INSERT INTO users (name, email, password, confirmation_token, created_at) VALUES (?, ?, ?, ?, NOW())';
        const [result] = await db.execute(query, [name, email, password, confirmationToken]);

        // Kembalikan data pengguna yang baru dibuat
        return {
            id: result.insertId,
            name,
            email,
            confirmation_token: confirmationToken, // Return token for sending email
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
    confirmUser: async (confirmationToken) => {
        const query = 'UPDATE users SET is_confirmed = TRUE, confirmation_token = NULL WHERE confirmation_token = ?';
        const [result] = await db.execute(query, [confirmationToken]);

        if (result.affectedRows === 0) {
            throw new Error('Invalid confirmation token');
        }

        return { success: true };
    },

    // Fungsi untuk mengecek apakah pengguna sudah dikonfirmasi
    isConfirmed: async (id) => {
        const query = 'SELECT is_confirmed FROM users WHERE id = ?';
        const [rows] = await db.execute(query, [id]);

        if (rows.length === 0) {
            return null; // User not found
        }

        return rows[0].is_confirmed;
    }
};

module.exports = User;