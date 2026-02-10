const db = require('../config/database');

const Notes = {
    // Fungsi untuk mendapatkan semua catatan milik pengguna tertentu
    getAllByUserId: async (userId) => {
        const query = 'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk mendapatkan satu catatan berdasarkan ID dan ID pengguna
    getByIdAndUserId: async (noteId, userId) => {
        const query = 'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?';
        const [rows] = await db.execute(query, [noteId, userId]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk membuat catatan baru
    create: async ({ userId, title, content }) => {
        const query = 'INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)';
        const [result] = await db.execute(query, [userId, title, content]);

        // Kembalikan data catatan yang baru dibuat
        return {
            id: result.insertId,
            userId,
            title,
            content,
            created_at: new Date()
        };
    },

    // Fungsi untuk memperbarui catatan
    update: async (noteId, userId, { title, content }) => {
        const query = 'UPDATE notes SET title = ?, content = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [title, content, noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin untuk mengedit');
        }

        // Kembalikan data catatan yang diperbarui
        return {
            id: noteId,
            userId,
            title,
            content,
            updated_at: new Date()
        };
    },

    // Fungsi untuk menghapus catatan
    delete: async (noteId, userId) => {
        const query = 'DELETE FROM notes WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin untuk menghapus');
        }

        return { id: noteId };
    }
};

module.exports = Notes;