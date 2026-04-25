/**
 * Admin Category Management Service
 */

const db = require('../config/database');

const categoryService = {
    /**
     * Get all categories with product count
     */
    async getAllCategories() {
        try {
            const [categories] = await db.execute(`
                SELECT
                    c.id,
                    c.name,
                    c.description,
                    COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.id, c.name, c.description
                ORDER BY c.id ASC
            `);

            return { success: true, data: categories };
        } catch (error) {
            console.error('[categoryService.getAllCategories] Error:', error);
            throw error;
        }
    },

    /**
     * Create new category
     */
    async createCategory(name, description = '') {
        try {
            // Check if category name already exists
            const [existing] = await db.execute('SELECT id FROM categories WHERE name = ?', [name]);
            if (existing.length > 0) {
                throw new Error('Kategori dengan nama ini sudah ada');
            }

            const [result] = await db.execute(
                'INSERT INTO categories (name, description, created_at) VALUES (?, ?, NOW())',
                [name, description]
            );

            return {
                success: true,
                data: { id: result.insertId, name, description },
                message: 'Kategori berhasil ditambahkan'
            };
        } catch (error) {
            console.error('[categoryService.createCategory] Error:', error);
            throw error;
        }
    },

    /**
     * Update category
     */
    async updateCategory(id, name, description = '') {
        try {
            // Check if exists
            const [existing] = await db.execute('SELECT id FROM categories WHERE id = ?', [id]);
            if (existing.length === 0) {
                throw new Error('Kategori tidak ditemukan');
            }

            // Check if new name conflicts with existing
            const [nameCheck] = await db.execute('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
            if (nameCheck.length > 0) {
                throw new Error('Nama kategori sudah digunakan kategori lain');
            }

            await db.execute(
                'UPDATE categories SET name = ?, description = ? WHERE id = ?',
                [name, description, id]
            );

            return {
                success: true,
                data: { id, name, description },
                message: 'Kategori berhasil diupdate'
            };
        } catch (error) {
            console.error('[categoryService.updateCategory] Error:', error);
            throw error;
        }
    },

    /**
     * Delete category
     */
    async deleteCategory(id) {
        try {
            // Check if category has products
            const [products] = await db.execute('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
            if (products[0].count > 0) {
                throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${products[0].count} produk`);
            }

            // Check if exists
            const [existing] = await db.execute('SELECT id, name FROM categories WHERE id = ?', [id]);
            if (existing.length === 0) {
                throw new Error('Kategori tidak ditemukan');
            }

            await db.execute('DELETE FROM categories WHERE id = ?', [id]);

            return {
                success: true,
                message: `Kategori "${existing[0].name}" berhasil dihapus`
            };
        } catch (error) {
            console.error('[categoryService.deleteCategory] Error:', error);
            throw error;
        }
    }
};

module.exports = categoryService;
