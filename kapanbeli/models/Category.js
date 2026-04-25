const db = require('../config/database');

const Category = {
    // Fungsi untuk mendapatkan kategori berdasarkan ID
    getById: async (id) => {
        try {
            const query = 'SELECT * FROM categories WHERE id = ?';
            const [rows] = await db.execute(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error getting category by ID:', error);
            throw error;
        }
    },

    // Fungsi untuk mendapatkan semua kategori
    getAll: async () => {
        try {
            const query = 'SELECT * FROM categories ORDER BY name';
            const [rows] = await db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting all categories:', error);
            throw error;
        }
    }
};

module.exports = Category;