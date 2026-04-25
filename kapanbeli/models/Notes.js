const db = require('../config/database');

const Notes = {
    // Fungsi untuk mendapatkan semua catatan milik pengguna tertentu
    getAllByUserId: async (userId) => {
        const query = 'SELECT id, title, content, status, is_completed, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk mendapatkan satu catatan berdasarkan ID dan ID pengguna
    getByIdAndUserId: async (noteId, userId) => {
        const query = 'SELECT id, title, content, status, is_completed, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?';
        const [rows] = await db.execute(query, [noteId, userId]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk membuat catatan baru
    create: async ({ userId, title, content, status }) => {
        const query = 'INSERT INTO notes (user_id, title, content, status) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [userId, title, content, status || 'Belum Selesai']);

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
            status: status || 'Belum Selesai',
            created_at: new Date()
        };
    },

    // Fungsi untuk memperbarui catatan
    update: async (noteId, userId, { title, content, status }) => {
        const query = 'UPDATE notes SET title = ?, content = ?, status = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [title, content, status || 'Belum Selesai', noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin untuk mengedit');
        }

        // Kembalikan data catatan yang diperbarui
        return {
            id: noteId,
            userId,
            title,
            content,
            status: status || 'Belum Selesai',
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
        const query = 'SELECT id, title, content, status, is_completed, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 5';
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk toggle status (cycle: Belum Selesai -> Pending -> Selesai -> Belum Selesai)
    toggleStatus: async (noteId, userId) => {
        // Get current status first
        const currentNote = await Notes.getByIdAndUserId(noteId, userId);
        if (!currentNote) {
            throw new Error('Note tidak ditemukan atau tidak memiliki izin');
        }

        const statusMap = {
            'Belum Selesai': 'Pending',
            'Pending': 'Selesai',
            'Selesai': 'Belum Selesai'
        };

        const newStatus = statusMap[currentNote.status] || 'Belum Selesai';
        const query = 'UPDATE notes SET status = ? WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [newStatus, noteId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Gagal memperbarui status catatan');
        }

        return {
            id: noteId,
            status: newStatus,
            updated_at: new Date()
        };
    }
};

module.exports = Notes;