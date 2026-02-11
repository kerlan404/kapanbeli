// models/Product.js
const db = require('../config/database');

const Product = {
    // Fungsi untuk mendapatkan semua produk milik pengguna tertentu
    getAllByUserId: async (userId) => {
        try {
            const query = `
                SELECT id, name, description, category_id, price, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
                FROM products
                WHERE user_id = ?
                ORDER BY created_at DESC
            `;
            const [rows] = await db.execute(query, [userId]);
            return rows;
        } catch (error) {
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, querying with available fields');
                const query = `
                    SELECT id, name, category_id, price, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
                    FROM products
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                `;
                const [rows] = await db.execute(query, [userId]);
                // Add default values for missing columns
                return rows.map(row => ({
                    ...row,
                    description: row.description || null,
                    unit: row.unit || null,
                    quantity: row.quantity || 1,
                    expiry_date: row.expiry_date || null,
                    notes: row.notes || ''
                }));
            }
            throw error;
        }
    },

    // Fungsi untuk mendapatkan satu produk berdasarkan ID dan ID pengguna
    getByIdAndUserId: async (productId, userId) => {
        try {
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
        } catch (error) {
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, querying with available fields');
                const query = `
                    SELECT id, name, category_id, price, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
                    FROM products
                    WHERE id = ? AND user_id = ?
                `;
                const [rows] = await db.execute(query, [productId, userId]);

                if (rows.length === 0) {
                    return null;
                }

                // Add default values for missing columns
                return {
                    ...rows[0],
                    description: rows[0].description || null,
                    unit: rows[0].unit || null,
                    quantity: rows[0].quantity || 1,
                    expiry_date: rows[0].expiry_date || null,
                    notes: rows[0].notes || ''
                };
            }
            throw error;
        }
    },

    // Fungsi untuk membuat produk baru
    create: async ({
        user_id, name, description, category_id, price, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        try {
            // Try to insert with all columns first
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
        } catch (error) {
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, inserting with available fields');
                // Insert with only the basic columns that are known to exist
                const query = `
                    INSERT INTO products (
                        user_id, name, description, category_id, price, stock_quantity,
                        min_stock_level, image_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const [result] = await db.execute(query, [
                    user_id, name, description, category_id, price, stock_quantity,
                    min_stock_level, image_url
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
                    unit: unit || null,
                    quantity: quantity || 1,
                    expiry_date: expiry_date || null,
                    notes: notes || '',
                    created_at: new Date()
                };
            }
            throw error;
        }
    },

    // Fungsi untuk memperbarui produk
    update: async (productId, userId, {
        name, description, category_id, price, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        try {
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
        } catch (error) {
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, updating with available fields');
                const query = `
                    UPDATE products
                    SET name = ?, description = ?, category_id = ?, price = ?, stock_quantity = ?,
                        min_stock_level = ?, image_url = ?, updated_at = NOW()
                    WHERE id = ? AND user_id = ?
                `;
                const [result] = await db.execute(query, [
                    name, description, category_id, price, stock_quantity,
                    min_stock_level, image_url,
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
                    unit: unit || null,
                    quantity: quantity || 1,
                    expiry_date: expiry_date || null,
                    notes: notes || '',
                    updated_at: new Date()
                };
            }
            throw error;
        }
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
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, querying with available fields');
                const query = `
                    SELECT id, user_id, name, category_id, price, stock_quantity,
                           min_stock_level, image_url, created_at, updated_at
                    FROM products
                    ORDER BY created_at DESC
                `;
                const [rows] = await db.execute(query);
                // Add default values for missing columns
                return rows.map(row => ({
                    ...row,
                    description: row.description || null,
                    unit: row.unit || null,
                    quantity: row.quantity || 1,
                    expiry_date: row.expiry_date || null,
                    notes: row.notes || ''
                }));
            }
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