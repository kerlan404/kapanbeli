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

    // Fungsi untuk mendapatkan semua saran pembelian - stok rendah + kadaluarsa
    async getAllSuggestions(req, res) {
        try {
            const userId = req.session.user?.id;

            console.log('=== GET ALL SUGGESTIONS ===');
            console.log('Session user:', req.session.user);
            console.log('User ID:', userId);

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Dapatkan semua produk user
            const products = await ProductModel.getAllByUserId(userId);
            console.log('Products retrieved:', products.length);

            // 1. Filter produk dengan stok rendah (stok <= minimal)
            const lowStock = products.filter(p => {
                const isOutOfStock = p.stock_quantity <= 0;
                const isLowStock = p.stock_quantity <= p.min_stock_level;
                return isOutOfStock || isLowStock;
            });
            console.log('Low stock products:', lowStock.length);

            // 2. Filter produk yang sudah kadaluarsa
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const expired = products.filter(p => {
                if (!p.expiry_date) return false;
                const expiryDate = new Date(p.expiry_date);
                return expiryDate < today;
            });
            console.log('Expired products:', expired.length);

            // 3. Filter produk yang hampir kadaluarsa (dalam 7 hari)
            const expiringSoon = products.filter(p => {
                if (!p.expiry_date) return false;
                const expiryDate = new Date(p.expiry_date);
                const diffTime = expiryDate - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays >= 0 && diffDays <= 7;
            });
            console.log('Expiring soon products:', expiringSoon.length);

            // 4. Buat list unified (gabungkan tanpa duplikat)
            const suggestionMap = new Map();

            // Tambahkan low stock
            lowStock.forEach(p => {
                const isOutOfStock = p.stock_quantity <= 0;
                suggestionMap.set(p.id, {
                    ...p,
                    category: isOutOfStock ? 'Habis' : 'Stok Rendah',
                    type: 'low-stock',
                    color: isOutOfStock ? 'red' : 'yellow',
                    badge: `${p.stock_quantity} ${p.unit || ''}`,
                    alertText: isOutOfStock ? 'HABIS!' : 'STOK RENDAH!',
                    alertIcon: isOutOfStock ? 'fa-times-circle' : 'fa-exclamation-triangle',
                    buttonText: 'Beli'
                });
            });

            // Tambahkan expired (timpa jika sudah ada)
            expired.forEach(p => {
                const existing = suggestionMap.get(p.id);
                if (existing) {
                    // Sudah ada di low stock, tambahkan status expired
                    existing.isExpired = true;
                    existing.category = 'Kadaluarsa';
                    existing.type = 'expired';
                    existing.color = 'red';
                    existing.alertText = 'KADALUARSA!';
                    existing.alertIcon = 'fa-trash-alt';
                    existing.buttonText = 'Beli & Buang';
                } else {
                    // Belum ada, tambahkan baru
                    suggestionMap.set(p.id, {
                        ...p,
                        category: 'Kadaluarsa',
                        type: 'expired',
                        color: 'red',
                        badge: `${p.stock_quantity} ${p.unit || ''}`,
                        alertText: 'KADALUARSA!',
                        alertIcon: 'fa-trash-alt',
                        buttonText: 'Beli & Buang',
                        isExpired: true
                    });
                }
            });

            // Tambahkan expiring soon (hanya jika belum expired)
            expiringSoon.forEach(p => {
                if (!suggestionMap.has(p.id)) {
                    const expiryDate = new Date(p.expiry_date);
                    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                    suggestionMap.set(p.id, {
                        ...p,
                        category: 'Hampir Kadaluarsa',
                        type: 'expiring',
                        color: 'orange',
                        badge: `${diffDays} hari lagi`,
                        alertText: `Hampir Kadaluarsa!`,
                        alertIcon: 'fa-clock',
                        buttonText: 'Gunakan',
                        daysLeft: diffDays
                    });
                }
            });

            // Convert map to array
            const suggestions = Array.from(suggestionMap.values());

            // 5. Sort: Expired -> Habis -> Stok Rendah -> Hampir Kadaluarsa
            const typeOrder = { 'expired': 1, 'low-stock': 2, 'expiring': 3 };
            suggestions.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return typeOrder[a.type] - typeOrder[b.type];
            });

            // 6. Stats
            const expiredCount = suggestions.filter(s => s.type === 'expired').length;
            const outOfStock = suggestions.filter(s => s.type === 'low-stock' && s.stock_quantity <= 0).length;
            const lowStockCount = suggestions.filter(s => s.type === 'low-stock' && s.stock_quantity > 0).length;
            const expiringCount = suggestions.filter(s => s.type === 'expiring').length;

            console.log('Total suggestions:', suggestions.length);
            console.log('Expired:', expiredCount);
            console.log('Out of stock:', outOfStock);
            console.log('Low stock:', lowStockCount);
            console.log('Expiring soon:', expiringCount);

            res.status(200).json({
                success: true,
                suggestions: suggestions,
                stats: {
                    expiredCount: expiredCount,
                    outOfStockCount: outOfStock,
                    lowStockCount: lowStockCount,
                    expiringCount: expiringCount,
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
