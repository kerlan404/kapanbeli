// controllers/adminController.js
const User = require('../models/User');
const ProductModel = require('../models/Product');
const NotesModel = require('../models/Notes');

const adminController = {
    // Fungsi untuk mendapatkan statistik dashboard
    async getStats(req, res) {
        try {
            // Gunakan fungsi baru di User model untuk statistik lengkap
            const stats = await User.getDashboardStats();

            res.status(200).json({
                success: true,
                stats: stats
            });
        } catch (error) {
            console.error('Error getting admin stats:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik.'
            });
        }
    },

    // Fungsi untuk mendapatkan semua pengguna dengan detail lengkap
    async getAllUsers(req, res) {
        try {
            const users = await User.getAllUsersWithDetails();

            res.status(200).json({
                success: true,
                users: users
            });
        } catch (error) {
            console.error('Error getting all users:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil daftar pengguna.'
            });
        }
    },

    // Fungsi untuk mendapatkan log aktivitas
    async getActivityLogs(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 100;
            const logs = await User.getAllLoginLogs(limit);

            res.status(200).json({
                success: true,
                activity: logs
            });
        } catch (error) {
            console.error('Error getting activity logs:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil log aktivitas.'
            });
        }
    },

    // Fungsi untuk mendapatkan semua produk dari semua pengguna
    async getAllProducts(req, res) {
        try {
            const products = await ProductModel.getAllProductsFromAllUsers();

            // Tambahkan informasi nama pengguna ke produk
            const productsWithUser = await Promise.all(products.map(async (product) => {
                const user = await User.findById(product.user_id);
                return {
                    ...product,
                    user_name: user ? user.name : 'Unknown User',
                    user_email: user ? user.email : 'Unknown'
                };
            }));

            res.status(200).json({
                success: true,
                products: productsWithUser
            });
        } catch (error) {
            console.error('Error getting all products:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil daftar produk.'
            });
        }
    },

    // Fungsi untuk mendapatkan detail pengguna
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

            // Dapatkan login logs user
            const loginLogs = await User.getLoginLogs(userId, 10);

            // Dapatkan produk user
            const userProducts = await ProductModel.getAllByUserId(userId);

            // Dapatkan notes user
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

    // Fungsi untuk mendapatkan produk dari pengguna tertentu
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

    // Fungsi untuk BAN user
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

            // Cek apakah user yang akan di-ban adalah admin
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

            // Ban user
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

    // Fungsi untuk UNBAN user
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

            // Unban user
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

    // Fungsi untuk mendapatkan user yang di-ban
    async getBannedUsers(req, res) {
        try {
            const users = await User.getAllUsersWithDetails();
            const bannedUsers = users.filter(u => u.is_banned || u.status === 'banned');

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

    // Fungsi untuk mendapatkan statistik produk per user
    async getProductStatsByUser(req, res) {
        try {
            const stats = await User.getDashboardStats();
            
            res.status(200).json({
                success: true,
                stats: {
                    productsByUser: stats.productsByUser,
                    productsByCategory: stats.productsByCategory
                }
            });
        } catch (error) {
            console.error('Error getting product stats:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik produk.'
            });
        }
    },

    // Fungsi untuk mendapatkan aktivitas login (grafik)
    async getLoginActivity(req, res) {
        try {
            const stats = await User.getDashboardStats();
            
            res.status(200).json({
                success: true,
                loginActivity: stats.loginActivity,
                usersOnlineToday: stats.usersOnlineToday
            });
        } catch (error) {
            console.error('Error getting login activity:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil aktivitas login.'
            });
        }
    }
};

module.exports = adminController;
