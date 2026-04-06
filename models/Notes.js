const db = require('../config/database');

const Notes = {
    // Fungsi untuk mendapatkan semua catatan milik pengguna tertentu
    getAllByUserId: async (userId) => {
        const query = 'SELECT id, title, content, is_completed, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk mendapatkan satu catatan berdasarkan ID dan ID pengguna
    getByIdAndUserId: async (noteId, userId) => {
        const query = 'SELECT id, title, content, is_completed, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?';
        const [rows] = await db.execute(query, [noteId, userId]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk membuat catatan baru
    create: async ({ userId, title, content, is_completed }) => {
        const query = 'INSERT INTO notes (user_id, title, content, is_completed) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [userId, title, content, is_completed || false]);

        // Update user stats after creating note (lazy require to avoid circular dependency)
        setImmediate(async () => {
            try {
                const User = require('../models/User');
                await User.updateUserStats(userId, { total_notes: 'increment' }).catch(err => {
                    console.error('Failed to update user stats after note creation:', err);
                });
            } catch (err) {
                console.error('Error loading User model:', err);
            }
        });

        // Kembalikan data catatan yang baru dibuat
        return {
            id: result.insertId,
            userId,
            title,
            content,
            is_completed: is_completed || false,
            created_at: new Date()
        };
    },

    // Fungsi untuk memperbarui catatan
    update: async (noteId, userId, { title, content, is_completed }) => {
        const query = 'UPDATE notes SET title = ?, content = ?, is_completed = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [title, content, is_completed !== undefined ? is_completed : false, noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin untuk mengedit');
        }

        // Kembalikan data catatan yang diperbarui
        return {
            id: noteId,
            userId,
            title,
            content,
            is_completed: is_completed || false,
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

        // Update user stats after deleting note (lazy require to avoid circular dependency)
        setImmediate(async () => {
            try {
                const User = require('../models/User');
                await User.updateUserStats(userId, { total_notes: 'decrement' }).catch(err => {
                    console.error('Failed to update user stats after note deletion:', err);
                });
            } catch (err) {
                console.error('Error loading User model:', err);
            }
        });

        return { id: noteId };
    },

    // Fungsi untuk mendapatkan catatan terbaru milik pengguna
    getRecentByUserId: async (userId) => {
        const query = 'SELECT id, title, content, is_completed, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk toggle status completed
    toggleStatus: async (noteId, userId) => {
        // Get current status first
        const currentNote = await Notes.getByIdAndUserId(noteId, userId);
        if (!currentNote) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin');
        }

        const newStatus = !currentNote.is_completed;
        const query = 'UPDATE notes SET is_completed = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [newStatus, noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Gagal memperbarui status catatan');
        }

        return {
            id: noteId,
            is_completed: newStatus,
            updated_at: new Date()
        };
    }
};

module.exports = Notes;