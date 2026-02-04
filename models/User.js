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

    // Fungsi untuk membuat pengguna baru
    create: async ({ name, email, password }) => {
        const query = 'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, NOW())';
        const [result] = await db.execute(query, [name, email, password]);
        
        // Kembalikan data pengguna yang baru dibuat
        return {
            id: result.insertId,
            name,
            email,
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
    }
};

module.exports = User;