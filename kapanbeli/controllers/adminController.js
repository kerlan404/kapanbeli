// controllers/adminController.js
const User = require('../models/User');
const ProductModel = require('../models/Product');
const NotesModel = require('../models/Notes');
const adminService = require('../services/adminService');

const adminController = {
    /**
     * GET /api/admin/stats
     * Unified stats endpoint for admin dashboard
     */
    async getStats(req, res) {
        try {
            const stats = await adminService.getStats();

            res.status(200).json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('[adminController.getStats] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik.'
            });
        }
    },

    /**
     * GET /api/admin/users
     * Get all users with pagination and filters
     */
    async getAllUsers(req, res) {
        try {
            const { page = 1, limit = 100, search = '', status = '', role = '' } = req.query;

            const result = await adminService.getUsersWithStats({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                role
            });

            res.status(200).json({
                success: true,
                users: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('[adminController.getAllUsers] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil daftar pengguna: ' + error.message,
                users: []
            });
        }
    },

    /**
     * GET /api/admin/user/:id
     * Get user details by ID
     */
    async getUserById(req, res) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID pengguna tidak valid.'
                });
            }

            const user = await User.findByIdWithDetails(userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan.'
                });
            }

            const loginLogs = await User.getLoginLogs(userId, 10);
            const userProducts = await ProductModel.getAllByUserId(userId);
            const userNotes = await NotesModel.getAllByUserId(userId);

            res.status(200).json({
                success: true,
                user: user,
                loginLogs: loginLogs,
                products: userProducts,
                notes: userNotes
            });
        } catch (error) {
            console.error('Error getting user by ID:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil data pengguna.'
            });
        }
    },

    /**
     * GET /api/admin/user/:id/products
     * Get products by user ID
     */
    async getUserProducts(req, res) {
        try {
            const userId = req.params.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID pengguna tidak valid.'
                });
            }

            const products = await ProductModel.getAllByUserId(userId);

            res.status(200).json({
                success: true,
                products: products
            });
        } catch (error) {
            console.error('Error getting user products:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil daftar produk pengguna.'
            });
        }
    },

    /**
     * POST /api/admin/user/:userId/ban
     * Ban a user
     */
    async banUser(req, res) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            const adminId = req.session.user.id;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID pengguna tidak valid.'
                });
            }

            if (!reason || reason.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Alasan ban harus diisi.'
                });
            }

            const userToBan = await User.findById(userId);
            if (!userToBan) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan.'
                });
            }

            if (userToBan.role === 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Tidak dapat ban akun admin.'
                });
            }

            await User.banUser(userId, reason, adminId);

            res.status(200).json({
                success: true,
                message: `Pengguna ${userToBan.name} telah di-ban.`,
                user: {
                    id: userId,
                    name: userToBan.name,
                    email: userToBan.email,
                    is_banned: true,
                    ban_reason: reason
                }
            });
        } catch (error) {
            console.error('Error banning user:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat membanned pengguna.'
            });
        }
    },

    /**
     * POST /api/admin/user/:userId/unban
     * Unban a user
     */
    async unbanUser(req, res) {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID pengguna tidak valid.'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan.'
                });
            }

            await User.unbanUser(userId);

            res.status(200).json({
                success: true,
                message: `Pengguna ${user.name} telah di-unban.`,
                user: {
                    id: userId,
                    name: user.name,
                    email: user.email,
                    is_banned: false,
                    ban_reason: null
                }
            });
        } catch (error) {
            console.error('Error unbanning user:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat meng-unban pengguna.'
            });
        }
    },

    /**
     * GET /api/admin/users/banned
     * Get all banned users
     */
    async getBannedUsers(req, res) {
        try {
            const users = await User.getAllUsersWithDetails();
            const bannedUsers = users.filter(u => u.is_banned || u.status === 'banned' || u.account_status === 'suspended');

            res.status(200).json({
                success: true,
                users: bannedUsers
            });
        } catch (error) {
            console.error('Error getting banned users:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil daftar pengguna yang di-ban.'
            });
        }
    },

    /**
     * GET /api/admin/stats/active-users
     * Get most active users for dashboard widget
     */
    async getActiveUsers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;
            const users = await adminService.getMostActiveUsers(limit);

            res.status(200).json({
                success: true,
                users: users
            });
        } catch (error) {
            console.error('[adminController.getActiveUsers] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil pengguna aktif.'
            });
        }
    }
};

module.exports = adminController;
