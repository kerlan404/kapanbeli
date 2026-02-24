const ProductModel = require('../models/Product');

const suggestionsController = {
    // Middleware untuk otentikasi - menggunakan session
    isAuthenticated(req, res, next) {
        if (req.session.user) {
            next();
        } else {
            res.status(401).json({
                success: false,
                message: 'Akses ditolak. Silakan login terlebih dahulu.'
            });
        }
    },

    // Middleware untuk admin saja
    isAdmin(req, res, next) {
        if (req.session.user && req.session.user.role === 'admin') {
            next();
        } else {
            res.status(403).json({
                success: false,
                message: 'Akses ditolak. Admin saja.'
            });
        }
    },

    // Fungsi untuk mendapatkan semua saran pembelian (low stock + expiring soon)
    async getAllSuggestions(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Dapatkan semua produk user
            const products = await ProductModel.getAllByUserId(userId);

            // 1. Filter produk dengan stok rendah
            const lowStock = products.filter(p => 
                p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0
            );

            // 2. Filter produk yang hampir kadaluarsa (dalam 7 hari)
            const expiring = products.filter(p => {
                if (!p.expiry_date) return false;
                const diffDays = Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            });

            // 3. Buat list unified dengan kategori
            const suggestions = [
                ...lowStock.map(p => ({ 
                    ...p, 
                    category: 'Stok Rendah', 
                    type: 'low-stock', 
                    color: 'red',
                    badge: `Sisa: ${p.stock_quantity} ${p.unit || ''}`
                })),
                ...expiring.map(p => ({ 
                    ...p, 
                    category: 'Hampir Kadaluarsa', 
                    type: 'expiring', 
                    color: 'yellow',
                    badge: `Sisa: ${Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))} hari`
                }))
            ];

            // 4. Sort berdasarkan kategori lalu nama
            suggestions.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type.localeCompare(b.type);
            });

            res.status(200).json({
                success: true,
                suggestions: suggestions,
                stats: {
                    lowStockCount: lowStock.length,
                    expiringCount: expiring.length,
                    totalCount: suggestions.length
                }
            });

        } catch (error) {
            console.error('Get all suggestions error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil saran pembelian.'
            });
        }
    },

    // Fungsi untuk menyetujui saran (membeli/mengisi stok)
    async approveSuggestion(req, res) {
        try {
            const userId = req.session.user?.id;
            const { productId, type, newStock, expiryDate } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!productId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID produk tidak valid.'
                });
            }

            // Cek apakah produk milik user ini
            const product = await ProductModel.getByIdAndUserId(productId, userId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan.'
                });
            }

            if (type === 'low-stock') {
                // Update stok dan tanggal kadaluarsa
                const updateData = {
                    stock_quantity: parseFloat(newStock) || product.stock_quantity,
                    expiry_date: expiryDate || product.expiry_date
                };

                await ProductModel.update(productId, userId, updateData);

                res.status(200).json({
                    success: true,
                    message: 'Stok berhasil diperbarui.',
                    product: {
                        ...product,
                        ...updateData
                    }
                });

            } else if (type === 'expiring') {
                // Tandai produk sudah digunakan (set stok ke 0 atau hapus)
                await ProductModel.update(productId, userId, {
                    stock_quantity: 0
                });

                res.status(200).json({
                    success: true,
                    message: 'Produk ditandai sudah digunakan.'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Tipe saran tidak valid.'
                });
            }

        } catch (error) {
            console.error('Approve suggestion error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memproses saran.'
            });
        }
    },

    // Fungsi untuk admin - mendapatkan semua saran dari semua user
    async getAllSuggestionsAdmin(req, res) {
        try {
            const User = require('../models/User');
            
            // Dapatkan semua user
            const users = await User.getAllUsersWithDetails();
            
            const allSuggestions = [];
            
            // Untuk setiap user, dapatkan produk mereka
            for (const user of users) {
                const products = await ProductModel.getAllByUserId(user.id);
                
                const lowStock = products.filter(p => 
                    p.stock_quantity <= p.min_stock_level && p.stock_quantity > 0
                );
                
                const expiring = products.filter(p => {
                    if (!p.expiry_date) return false;
                    const diffDays = Math.ceil((new Date(p.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
                    return diffDays >= 0 && diffDays <= 7;
                });
                
                const userSuggestions = [
                    ...lowStock.map(p => ({ 
                        ...p, 
                        category: 'Stok Rendah', 
                        type: 'low-stock',
                        user_name: user.name,
                        user_email: user.email
                    })),
                    ...expiring.map(p => ({ 
                        ...p, 
                        category: 'Hampir Kadaluarsa', 
                        type: 'expiring',
                        user_name: user.name,
                        user_email: user.email
                    }))
                ];
                
                allSuggestions.push(...userSuggestions);
            }
            
            // Sort
            allSuggestions.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type.localeCompare(b.type);
            });
            
            res.status(200).json({
                success: true,
                suggestions: allSuggestions,
                stats: {
                    totalUsers: users.length,
                    totalSuggestions: allSuggestions.length
                }
            });
            
        } catch (error) {
            console.error('Get all suggestions admin error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil saran pembelian.'
            });
        }
    }
};

module.exports = suggestionsController;
