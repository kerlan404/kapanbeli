// controllers/adminController.js
const User = require('../models/User');
const ProductModel = require('../models/Product');

const adminController = {
    // Fungsi untuk mendapatkan statistik dashboard
    async getStats(req, res) {
        try {
            // Hitung total pengguna
            const totalUsers = await User.getTotalUsers();
            
            // Hitung pengguna aktif (misalnya yang login dalam 30 hari terakhir)
            const activeUsers = await User.getActiveUsers();
            
            // Hitung total produk
            const totalProducts = await ProductModel.getTotalProducts();
            
            // Hitung jumlah produk dengan stok rendah
            const lowStockItems = await ProductModel.getLowStockItems();
            
            res.status(200).json({
                success: true,
                stats: {
                    totalUsers: totalUsers,
                    activeUsers: activeUsers,
                    totalProducts: totalProducts,
                    lowStockItems: lowStockItems
                }
            });
        } catch (error) {
            console.error('Error getting admin stats:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik.'
            });
        }
    },

    // Fungsi untuk mendapatkan semua pengguna
    async getAllUsers(req, res) {
        try {
            const users = await User.getAllUsers();
            
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
            // Dalam implementasi nyata, ini akan mengambil data dari tabel log aktivitas
            // Untuk saat ini, kita buat mock data berdasarkan informasi yang tersedia
            const users = await User.getAllUsers();
            
            // Membuat log aktivitas sederhana berdasarkan data pengguna
            const activityLogs = users.map(user => ({
                user_id: user.id,
                user_name: user.name,
                user_email: user.email,
                last_login: user.last_login || user.created_at,
                last_logout: user.last_logout || null,
                ip_address: user.last_ip || 'N/A'
            }));
            
            res.status(200).json({
                success: true,
                activity: activityLogs
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
                    user_name: user ? user.name : 'Unknown User'
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
            
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'Pengguna tidak ditemukan.'
                });
            }
            
            res.status(200).json({
                success: true,
                user: user
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
    }
};

module.exports = adminController;