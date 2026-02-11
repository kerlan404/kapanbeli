// models/Product.js
const db = require('../config/database');

const Product = {
    // Fungsi untuk mendapatkan semua produk milik pengguna tertentu
    getAllByUserId: async (userId) => {
        const query = `
            SELECT id, name, description, category_id, price, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
            FROM products
            WHERE user_id = ?
            ORDER BY created_at DESC
        `;
        const [rows] = await db.execute(query, [userId]);
        return rows;
    },

    // Fungsi untuk mendapatkan satu produk berdasarkan ID dan ID pengguna
    getByIdAndUserId: async (productId, userId) => {
        const query = `
            SELECT id, name, description, category_id, price, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
            FROM products
            WHERE id = ? AND user_id = ?
        `;
        const [rows] = await db.execute(query, [productId, userId]);

        if (rows.length === 0) {
            return null;
        }

        return rows[0];
    },

    // Fungsi untuk membuat produk baru
    create: async ({
        user_id, name, description, category_id, price, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        // Gabungkan unit dan quantity menjadi deskripsi atau simpan terpisah jika kolom tambahan dibutuhkan
        // Untuk saat ini, kita simpan unit dan quantity ke kolom yang sesuai jika ada, atau gabungkan ke description
        // Asumsikan tabel products memiliki kolom unit, quantity, expiry_date, notes
        const query = `
            INSERT INTO products (
                user_id, name, description, category_id, price, stock_quantity,
                min_stock_level, image_url, unit, quantity, expiry_date, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            user_id, name, description, category_id, price, stock_quantity,
            min_stock_level, image_url, unit, quantity, expiry_date, notes
        ]);

        // Kembalikan data produk yang baru dibuat
        return {
            id: result.insertId,
            user_id,
            name,
            description,
            category_id,
            price,
            stock_quantity,
            min_stock_level,
            image_url,
            unit,
            quantity,
            expiry_date,
            notes,
            created_at: new Date()
        };
    },

    // Fungsi untuk memperbarui produk
    update: async (productId, userId, {
        name, description, category_id, price, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        const query = `
            UPDATE products
            SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?,
                min_stock_level = ?, image_url = ?, unit = ?, quantity = ?, expiry_date = ?, notes = ?, updated_at = NOW()
            WHERE id = ? AND user_id = ?
        `;
        const [result] = await db.execute(query, [
            name, description, category_id, price, stock_quantity,
            min_stock_level, image_url, unit, quantity, expiry_date, notes,
            productId, userId
        ]);

        if (result.affectedRows === 0) {
            throw new Error('Product tidak ditemukan atau tidak memiliki izin untuk mengedit');
        }

        // Kembalikan data produk yang diperbarui
        return {
            id: productId,
            user_id: userId,
            name,
            description,
            category_id,
            price,
            stock_quantity,
            min_stock_level,
            image_url,
            unit,
            quantity,
            expiry_date,
            notes,
            updated_at: new Date()
        };
    },

    // Fungsi untuk menghapus produk
    delete: async (productId, userId) => {
        const query = 'DELETE FROM products WHERE id = ? AND user_id = ?';
        const [result] = await db.execute(query, [productId, userId]);

        if (result.affectedRows === 0) {
            throw new Error('Product tidak ditemukan atau tidak memiliki izin untuk menghapus');
        }

        return { id: productId };
    },

    // Fungsi untuk mendapatkan semua produk dari semua pengguna
    getAllProductsFromAllUsers: async () => {
        try {
            const query = `
                SELECT id, user_id, name, description, category_id, price, stock_quantity, 
                       min_stock_level, image_url, unit, quantity, expiry_date, notes, created_at, updated_at
                FROM products
                ORDER BY created_at DESC
            `;
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting all products from all users:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan total jumlah produk
    getTotalProducts: async () => {
        try {
            const query = 'SELECT COUNT(*) as count FROM products';
            const [rows] = await db.execute(query);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting total products:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan jumlah produk dengan stok rendah
    getLowStockItems: async () => {
        try {
            const query = 'SELECT COUNT(*) as count FROM products WHERE stock_quantity <= min_stock_level';
            const [rows] = await db.execute(query);
            return rows[0].count;
        } catch (error) {
            console.error('Error getting low stock items:', error);
            throw error;
        }
    }
};

module.exports = Product;