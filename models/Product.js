// models/Product.js
const db = require('../config/database');

const Product = {
    // Fungsi untuk mendapatkan semua produk milik pengguna tertentu
    getAllByUserId: async (userId) => {
        console.log('Getting products for user ID:', userId); // Debug log
        try {
            const query = `
                SELECT id, name, description, category_id, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at, unit, quantity, expiry_date, notes
                FROM products
                WHERE user_id = ?
                ORDER BY created_at DESC
            `;
            const [rows] = await db.execute(query, [userId]);
            console.log('Retrieved products count:', rows.length); // Debug log
            return rows;
        } catch (error) {
            console.error('Database error in getAllByUserId:', error); // Debug log
            // Handle missing columns gracefully
            if (error.code === 'ER_BAD_FIELD_ERROR') {
                console.warn('Some columns may not exist in products table, querying with available fields');
                const query = `
                    SELECT id, name, category_id, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
                    FROM products
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                `;
                const [rows] = await db.execute(query, [userId]);
                console.log('Retrieved products count (fallback):', rows.length); // Debug log
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
                SELECT id, name, description, category_id, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at, unit, quantity, expiry_date, notes
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
                    SELECT id, name, category_id, stock_quantity, min_stock_level, image_url, user_id, created_at, updated_at
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
        user_id, name, description, category_id, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        try {
            // Try to insert with all columns first
            const query = `
                INSERT INTO products (
                    user_id, name, description, category_id, stock_quantity,
                    min_stock_level, image_url, unit, quantity, expiry_date, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await db.execute(query, [
                user_id, name, description, category_id, stock_quantity,
                min_stock_level, image_url, unit, quantity, expiry_date, notes
            ]);

            // Update user stats after creating product (lazy require to avoid circular dependency)
            setImmediate(async () => {
                try {
                    const User = require('../models/User');
                    await User.updateUserStats(user_id, { total_products: 'increment' }).catch(err => {
                        console.error('Failed to update user stats after product creation:', err);
                    });
                } catch (err) {
                    console.error('Error loading User model:', err);
                }
            });

            // Kembalikan data produk yang baru dibuat
            return {
                id: result.insertId,
                user_id,
                name,
                description,
                category_id,
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
                // Try to determine which columns exist by catching the error and building query dynamically
                // For now, use the most basic insert with only required fields
                const basicQuery = `
                    INSERT INTO products (
                        user_id, name, stock_quantity, min_stock_level, image_url
                    ) VALUES (?, ?, ?, ?, ?)
                `;
                const [result] = await db.execute(basicQuery, [
                    user_id, name, stock_quantity, min_stock_level, image_url
                ]);

                // Kembalikan data produk yang baru dibuat
                return {
                    id: result.insertId,
                    user_id,
                    name,
                    description: description || null,
                    category_id: category_id || null,
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
            // Handle foreign key constraint error
            else if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
                console.warn('Foreign key constraint failed, trying to insert without category_id');
                // Retry insertion without category_id
                const queryWithoutCategory = `
                    INSERT INTO products (
                        user_id, name, description, stock_quantity,
                        min_stock_level, image_url, unit, quantity, expiry_date, notes
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const [result] = await db.execute(queryWithoutCategory, [
                    user_id, name, description, stock_quantity,
                    min_stock_level, image_url, unit, quantity, expiry_date, notes
                ]);

                // Kembalikan data produk yang baru dibuat
                return {
                    id: result.insertId,
                    user_id,
                    name,
                    description,
                    category_id: null, // Set to null due to FK constraint
                    stock_quantity,
                    min_stock_level,
                    image_url,
                    unit,
                    quantity,
                    expiry_date,
                    notes,
                    created_at: new Date()
                };
            }
            throw error;
        }
    },

    // Fungsi untuk memperbarui produk
    update: async (productId, userId, {
        name, description, category_id, stock_quantity,
        min_stock_level, image_url, unit, quantity, expiry_date, notes
    }) => {
        try {
            const query = `
                UPDATE products
                SET name = ?, description = ?, category_id = ?, stock_quantity = ?,
                    min_stock_level = ?, image_url = ?, unit = ?, quantity = ?, expiry_date = ?, notes = ?, updated_at = NOW()
                WHERE id = ? AND user_id = ?
            `;
            const [result] = await db.execute(query, [
                name, description, category_id, stock_quantity,
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
                // Try with basic fields only
                const basicQuery = `
                    UPDATE products
                    SET name = ?, stock_quantity = ?, min_stock_level = ?, updated_at = NOW()
                    WHERE id = ? AND user_id = ?
                `;
                const [result] = await db.execute(basicQuery, [
                    name, stock_quantity, min_stock_level,
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
                    description: description || null,
                    category_id: category_id || null,
                    stock_quantity,
                    min_stock_level,
                    image_url: image_url || null,
                    unit: unit || null,
                    quantity: quantity || 1,
                    expiry_date: expiry_date || null,
                    notes: notes || '',
                    updated_at: new Date()
                };
            }
            // Handle foreign key constraint error
            else if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
                console.warn('Foreign key constraint failed, trying to update without category_id');
                // Retry update without category_id
                const queryWithoutCategory = `
                    UPDATE products
                    SET name = ?, description = ?, stock_quantity = ?,
                        min_stock_level = ?, image_url = ?, unit = ?, quantity = ?, expiry_date = ?, notes = ?, updated_at = NOW()
                    WHERE id = ? AND user_id = ?
                `;
                const [result] = await db.execute(queryWithoutCategory, [
                    name, description, stock_quantity,
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
                    category_id: null, // Set to null due to FK constraint
                    stock_quantity,
                    min_stock_level,
                    image_url,
                    unit,
                    quantity,
                    expiry_date,
                    notes,
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

        // Update user stats after deleting product (lazy require to avoid circular dependency)
        setImmediate(async () => {
            try {
                const User = require('../models/User');
                await User.updateUserStats(userId, { total_products: 'decrement' }).catch(err => {
                    console.error('Failed to update user stats after product deletion:', err);
                });
            } catch (err) {
                console.error('Error loading User model:', err);
            }
        });

        return { id: productId };
    },

    // Fungsi untuk mendapatkan semua produk dari semua pengguna
    getAllProductsFromAllUsers: async () => {
        try {
            const query = `
                SELECT id, user_id, name, description, category_id, stock_quantity,
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
                    SELECT id, user_id, name, category_id, stock_quantity,
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