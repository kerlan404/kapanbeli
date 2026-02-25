const NotesModel = require('../models/Notes');

const notesController = {
    // Fungsi untuk mendapatkan semua catatan milik pengguna yang sedang login
    async getAll(req, res) {
        try {
            const userId = req.session.user?.id; // Ambil ID pengguna dari session

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            const notes = await NotesModel.getAllByUserId(userId);

            res.status(200).json({
                success: true,
                notes: notes
            });

        } catch (error) {
            console.error('Get all notes error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil catatan.'
            });
        }
    },

    // Fungsi untuk mendapatkan satu catatan berdasarkan ID
    async getById(req, res) {
        try {
            const userId = req.session.user?.id;
            const noteId = req.params.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!noteId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID catatan tidak valid.'
                });
            }

            const note = await NotesModel.getByIdAndUserId(noteId, userId);

            if (!note) {
                return res.status(404).json({
                    success: false,
                    message: 'Catatan tidak ditemukan.'
                });
            }

            res.status(200).json({
                success: true,
                note: note
            });

        } catch (error) {
            console.error('Get note by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil catatan.'
            });
        }
    },

    // Fungsi untuk membuat catatan baru
    async create(req, res) {
        try {
            const userId = req.session.user?.id;
            const { title, content } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Judul catatan harus diisi.'
                });
            }

            const newNote = await NotesModel.create({
                userId,
                title,
                content: content || '' // Isi dengan string kosong jika tidak ada konten
            });

            // Log to activity_logs
            const activityLogsService = require('../services/activityLogsService');
            await activityLogsService.log(userId, 'CREATE', `Menciptakan catatan: "${title}"`, req.ip || 'unknown', req.get('user-agent') || 'unknown');

            res.status(201).json({
                success: true,
                message: 'Catatan berhasil dibuat.',
                note: newNote
            });

        } catch (error) {
            console.error('Create note error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat membuat catatan.'
            });
        }
    },

    // Fungsi untuk memperbarui catatan
    async update(req, res) {
        try {
            const userId = req.session.user?.id;
            const noteId = req.params.id;
            const { title, content } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!noteId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID catatan tidak valid.'
                });
            }

            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Judul catatan harus diisi.'
                });
            }

            // Cek apakah catatan milik pengguna ini
            const existingNote = await NotesModel.getByIdAndUserId(noteId, userId);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Catatan tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.'
                });
            }

            const updatedNote = await NotesModel.update(noteId, userId, {
                title,
                content: content || ''
            });

            res.status(200).json({
                success: true,
                message: 'Catatan berhasil diperbarui.',
                note: updatedNote
            });

        } catch (error) {
            console.error('Update note error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui catatan.'
            });
        }
    },

    // Fungsi untuk menghapus catatan
    async delete(req, res) {
        try {
            const userId = req.session.user?.id;
            const noteId = req.params.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!noteId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID catatan tidak valid.'
                });
            }

            // Cek apakah catatan milik pengguna ini
            const existingNote = await NotesModel.getByIdAndUserId(noteId, userId);
            if (!existingNote) {
                return res.status(404).json({
                    success: false,
                    message: 'Catatan tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.'
                });
            }

            await NotesModel.delete(noteId, userId);

            // Log to activity_logs
            const activityLogsService = require('../services/activityLogsService');
            await activityLogsService.log(userId, 'DELETE', `Menghapus catatan: "${existingNote.title}"`, req.ip || 'unknown', req.get('user-agent') || 'unknown');

            res.status(200).json({
                success: true,
                message: 'Catatan berhasil dihapus.'
            });

        } catch (error) {
            console.error('Delete note error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat menghapus catatan.'
            });
        }
    },

    // Fungsi untuk mendapatkan catatan terbaru milik pengguna
    async getRecent(req, res) {
        try {
            const userId = req.session.user?.id; // Ambil ID pengguna dari session

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            const recentNotes = await NotesModel.getRecentByUserId(userId);

            res.status(200).json({
                success: true,
                notes: recentNotes
            });

        } catch (error) {
            console.error('Get recent notes error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil catatan terbaru.'
            });
        }
    }
};

module.exports = notesController;