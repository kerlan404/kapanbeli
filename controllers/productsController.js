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
            // Handle both JSON and FormData requests
            let { name, description, category_id, stock_quantity, min_stock_level, image_url, unit, quantity, expiry_date, notes } = req.body;

            // Convert string values to appropriate types if they come from FormData
            stock_quantity = typeof stock_quantity === 'string' ? parseFloat(stock_quantity) || 0 : (stock_quantity || 0);
            min_stock_level = typeof min_stock_level === 'string' ? parseFloat(min_stock_level) || 5 : (min_stock_level || 5);
            quantity = typeof quantity === 'string' ? parseFloat(quantity) || 1 : (quantity || 1);

            // If file is uploaded, get the image URL from the file
            let imageUrl = image_url || null;
            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            if (!name) { // Validasi wajib minimal nama
                return res.status(400).json({
                    success: false,
                    message: 'Nama produk harus diisi.'
                });
            }

            // Validasi category_id, jika disediakan harus valid
            let categoryIdToUse = null;
            if (category_id) {
                // Cek apakah category_id valid
                const CategoryModel = require('../models/Category');
                const categoryExists = await CategoryModel.getById(category_id);
                if (categoryExists) {
                    categoryIdToUse = category_id;
                } else {
                    // Jika kategori tidak ditemukan, gunakan null
                    categoryIdToUse = null;
                }
            }

            // Panggil fungsi dari model untuk membuat produk baru
            const newProduct = await ProductModel.create({
                user_id: userId,
                name,
                description: description || null,
                category_id: categoryIdToUse,
                stock_quantity: stock_quantity || 0,
                min_stock_level: min_stock_level || 5, // Default
                image_url: imageUrl,
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
            // Handle both JSON and FormData requests
            let { name, description, category_id, stock_quantity, min_stock_level, image_url, unit, quantity, expiry_date, notes } = req.body;

            // Convert string values to appropriate types if they come from FormData
            stock_quantity = typeof stock_quantity === 'string' ? parseFloat(stock_quantity) || 0 : (stock_quantity || 0);
            min_stock_level = typeof min_stock_level === 'string' ? parseFloat(min_stock_level) || 5 : (min_stock_level || 5);
            quantity = typeof quantity === 'string' ? parseFloat(quantity) || 1 : (quantity || 1);

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

            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Nama produk harus diisi.'
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

            // Validasi category_id, jika disediakan harus valid
            let categoryIdToUpdate = existingProduct.category_id; // Gunakan kategori lama sebagai default
            if (category_id !== undefined) { // Jika category_id disediakan (termasuk null)
                if (category_id) {
                    // Cek apakah category_id valid
                    const CategoryModel = require('../models/Category');
                    const categoryExists = await CategoryModel.getById(category_id);
                    if (categoryExists) {
                        categoryIdToUpdate = category_id;
                    } else {
                        // Jika kategori tidak ditemukan, gunakan null
                        categoryIdToUpdate = null;
                    }
                } else {
                    // Jika category_id adalah null atau "" (falsy), gunakan null
                    categoryIdToUpdate = null;
                }
            }

            // If file is uploaded, get the image URL from the file
            let imageUrl = image_url || existingProduct.image_url;
            if (req.file) {
                imageUrl = `/uploads/${req.file.filename}`;
            }

            const updatedProduct = await ProductModel.update(productId, userId, {
                name,
                description: description || existingProduct.description,
                category_id: categoryIdToUpdate,
                stock_quantity: stock_quantity !== undefined ? stock_quantity : existingProduct.stock_quantity,
                min_stock_level: min_stock_level !== undefined ? min_stock_level : existingProduct.min_stock_level,
                image_url: imageUrl,
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

            console.log('Get stats for user ID:', userId); // Debug log

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Dapatkan semua produk milik pengguna
            const products = await ProductModel.getAllByUserId(userId);

            console.log('Products retrieved:', products.length); // Debug log

            // Hitung total produk - make sure to handle potential undefined values
            const total = Array.isArray(products) ? products.length : 0;

            // Hitung produk dengan stok rendah - ensure numeric comparison
            const lowStock = Array.isArray(products) ? products.filter(product => {
                const stock = parseFloat(product.stock_quantity) || 0;
                const minLevel = parseFloat(product.min_stock_level) || 5;
                return stock <= minLevel && stock > 0;
            }).length : 0;

            // Hitung produk yang stoknya habis - ensure numeric comparison
            const outOfStock = Array.isArray(products) ? products.filter(product => {
                const stock = parseFloat(product.stock_quantity) || 0;
                return stock <= 0;
            }).length : 0;

            // Total produk yang perlu dibeli (stok rendah atau habis)
            const shoppingList = lowStock + outOfStock;

            console.log('Stats calculated - Total:', total, 'Low stock:', lowStock, 'Out of stock:', outOfStock); // Debug log

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
    },

    // Fungsi untuk mendapatkan aktivitas terbaru milik pengguna
    async getRecentActivities(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // Dapatkan produk-produk terbaru milik pengguna
            const products = await ProductModel.getAllByUserId(userId);

            // Dapatkan catatan-catatan terbaru milik pengguna
            const NotesModel = require('../models/Notes');
            const notes = await NotesModel.getAllByUserId(userId);

            // Gabungkan dan urutkan berdasarkan tanggal terbaru
            let allActivities = [];

            // Tambahkan produk ke aktivitas
            products.forEach(product => {
                // Konversi timestamp ke objek Date jika bukan null/undefined
                const timestamp = product.created_at || product.updated_at || new Date();
                allActivities.push({
                    type: 'product',
                    title: `Menambahkan bahan: ${product.name}`,
                    content: `Stok: ${product.stock_quantity} ${product.unit || ''}`,
                    timestamp: timestamp,
                    icon: 'fa-box-open'
                });
            });

            // Tambahkan catatan ke aktivitas
            notes.forEach(note => {
                // Konversi timestamp ke objek Date jika bukan null/undefined
                const timestamp = note.created_at || note.updated_at || new Date();
                allActivities.push({
                    type: 'note',
                    title: note.title || 'Catatan Baru',
                    content: note.content || '',
                    timestamp: timestamp,
                    icon: 'fa-sticky-note'
                });
            });

            // Urutkan berdasarkan tanggal terbaru (descending)
            allActivities.sort((a, b) => {
                const dateA = new Date(a.timestamp);
                const dateB = new Date(b.timestamp);
                
                // Handle invalid dates
                if (isNaN(dateA.getTime())) {
                    return 1; // Move invalid dates to end
                }
                if (isNaN(dateB.getTime())) {
                    return -1; // Move invalid dates to end
                }
                
                return dateB - dateA; // Descending order (newest first)
            });

            // Ambil 5 aktivitas terbaru
            const recentActivities = allActivities.slice(0, 5);

            res.status(200).json({
                success: true,
                activities: recentActivities
            });

        } catch (error) {
            console.error('Get recent activities error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil aktivitas terbaru.'
            });
        }
    }
};

module.exports = productsController;