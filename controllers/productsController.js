// controllers/productsController.js
const ProductModel = require('../models/Product'); // Pastikan model Product sudah dibuat

const productsController = {
    // Fungsi untuk mendapatkan semua produk milik pengguna yang sedang login
    async getAll(req, res) {
        try {
            const userId = req.session.user?.id; // Ambil ID pengguna dari session

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Panggil fungsi dari model untuk mendapatkan produk berdasarkan user_id
            const products = await ProductModel.getAllByUserId(userId);

            res.status(200).json({
                success: true,
                products: products
            });

        } catch (error) {
            console.error('Get all products error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil produk.'
            });
        }
    },

    // Fungsi untuk membuat produk baru
    async create(req, res) {
        try {
            const userId = req.session.user?.id;
            const { name, description, category_id, price, stock_quantity, min_stock_level, image_url, unit, quantity, expiry_date, notes } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!name || !price) { // Validasi wajib minimal nama dan harga
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan harga produk harus diisi.'
                });
            }

            // Panggil fungsi dari model untuk membuat produk baru
            const newProduct = await ProductModel.create({
                user_id: userId,
                name,
                description: description || null,
                category_id: category_id || null,
                price,
                stock_quantity: stock_quantity || 0,
                min_stock_level: min_stock_level || 5, // Default
                image_url: image_url || null,
                unit: unit || null, // Misalnya 'kg', 'pcs', dll
                quantity: quantity || 1, // Jumlah satuan
                expiry_date: expiry_date || null,
                notes: notes || ''
            });

            res.status(201).json({
                success: true,
                message: 'Produk berhasil ditambahkan.',
                product: newProduct
            });

        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat menambahkan produk.'
            });
        }
    },

    // Fungsi untuk mendapatkan satu produk berdasarkan ID
    async getById(req, res) {
        try {
            const userId = req.session.user?.id;
            const productId = req.params.id;

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

            const product = await ProductModel.getByIdAndUserId(productId, userId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan.'
                });
            }

            res.status(200).json({
                success: true,
                product: product
            });

        } catch (error) {
            console.error('Get product by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil produk.'
            });
        }
    },

    // Fungsi untuk memperbarui produk
    async update(req, res) {
        try {
            const userId = req.session.user?.id;
            const productId = req.params.id;
            const { name, description, category_id, price, stock_quantity, min_stock_level, image_url, unit, quantity, expiry_date, notes } = req.body;

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

            if (!name || !price) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama dan harga produk harus diisi.'
                });
            }

            // Cek apakah produk milik pengguna ini
            const existingProduct = await ProductModel.getByIdAndUserId(productId, userId);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.'
                });
            }

            const updatedProduct = await ProductModel.update(productId, userId, {
                name,
                description: description || existingProduct.description,
                category_id: category_id || existingProduct.category_id,
                price,
                stock_quantity: stock_quantity !== undefined ? stock_quantity : existingProduct.stock_quantity,
                min_stock_level: min_stock_level !== undefined ? min_stock_level : existingProduct.min_stock_level,
                image_url: image_url || existingProduct.image_url,
                unit: unit || existingProduct.unit,
                quantity: quantity !== undefined ? quantity : existingProduct.quantity,
                expiry_date: expiry_date || existingProduct.expiry_date,
                notes: notes || existingProduct.notes
            });

            res.status(200).json({
                success: true,
                message: 'Produk berhasil diperbarui.',
                product: updatedProduct
            });

        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat memperbarui produk.'
            });
        }
    },

    // Fungsi untuk menghapus produk
    async delete(req, res) {
        try {
            const userId = req.session.user?.id;
            const productId = req.params.id;

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

            // Cek apakah produk milik pengguna ini
            const existingProduct = await ProductModel.getByIdAndUserId(productId, userId);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan atau Anda tidak memiliki izin untuk menghapusnya.'
                });
            }

            await ProductModel.delete(productId, userId);

            res.status(200).json({
                success: true,
                message: 'Produk berhasil dihapus.'
            });

        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat menghapus produk.'
            });
        }
    },

    // Fungsi untuk mendapatkan statistik produk
    async getStats(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Dapatkan semua produk milik pengguna
            const products = await ProductModel.getAllByUserId(userId);

            // Hitung total produk
            const total = products.length;

            // Hitung produk dengan stok rendah
            const lowStock = products.filter(product => 
                product.stock_quantity <= product.min_stock_level && product.stock_quantity > 0
            ).length;

            // Hitung produk yang stoknya habis
            const outOfStock = products.filter(product => 
                product.stock_quantity <= 0
            ).length;

            // Total produk yang perlu dibeli (stok rendah atau habis)
            const shoppingList = lowStock + outOfStock;

            res.status(200).json({
                success: true,
                total: total,
                lowStock: lowStock,
                outOfStock: outOfStock,
                shoppingList: shoppingList
            });

        } catch (error) {
            console.error('Get products stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik produk.'
            });
        }
    },

    // Fungsi untuk mendapatkan detail produk (untuk API)
    async getDetail(req, res) {
        try {
            const userId = req.session.user?.id;
            const productId = req.params.id;

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

            const product = await ProductModel.getByIdAndUserId(productId, userId);

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Produk tidak ditemukan.'
                });
            }

            res.status(200).json({
                success: true,
                product: product
            });

        } catch (error) {
            console.error('Get product detail error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil detail produk.'
            });
        }
    }
};

module.exports = productsController;