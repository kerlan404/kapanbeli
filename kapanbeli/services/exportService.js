/**
 * Admin Export Service
 * Export data ke CSV/Excel
 */

const db = require('../config/database');

const exportService = {
    /**
     * Export users to CSV
     */
    async exportUsers() {
        try {
            const [users] = await db.execute(`
                SELECT
                    u.id,
                    u.name,
                    u.email,
                    u.role,
                    u.account_status,
                    u.created_at,
                    u.last_login,
                    u.login_count,
                    COUNT(DISTINCT p.id) as total_products,
                    SUM(p.stock_quantity) as total_stock
                FROM users u
                LEFT JOIN products p ON u.id = p.user_id
                GROUP BY u.id, u.name, u.email, u.role, u.account_status, u.created_at, u.last_login, u.login_count
                ORDER BY u.created_at DESC
            `);

            const headers = ['ID', 'Nama', 'Email', 'Role', 'Status', 'Terdaftar', 'Login Terakhir', 'Total Login', 'Total Produk', 'Total Stok'];
            const rows = users.map(u => [
                u.id,
                `"${u.name}"`,
                u.email,
                u.role,
                u.account_status,
                this.formatDate(u.created_at),
                u.last_login ? this.formatDate(u.last_login) : '-',
                u.login_count,
                u.total_products,
                u.total_stock || 0
            ]);

            return this.toCSV(headers, rows, 'Data_Pengguna');
        } catch (error) {
            console.error('[exportService.exportUsers] Error:', error);
            throw error;
        }
    },

    /**
     * Export products to CSV
     */
    async exportProducts() {
        try {
            const [products] = await db.execute(`
                SELECT
                    p.id,
                    p.name,
                    c.name as category,
                    p.stock_quantity,
                    p.unit,
                    p.min_stock_level,
                    p.expiry_date,
                    p.is_deactivated_by_admin,
                    p.created_at,
                    u.name as owner,
                    u.email as owner_email
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                JOIN users u ON p.user_id = u.id
                ORDER BY p.created_at DESC
            `);

            const headers = ['ID', 'Nama Produk', 'Kategori', 'Stok', 'Satuan', 'Min Stok', 'Expired', 'Status', 'Dibuat', 'Pemilik', 'Email Pemilik'];
            const rows = products.map(p => [
                p.id,
                `"${p.name}"`,
                p.category || '-',
                p.stock_quantity,
                p.unit || '-',
                p.min_stock_level,
                p.expiry_date || '-',
                p.is_deactivated_by_admin ? 'Dinonaktifkan' : 'Aktif',
                this.formatDate(p.created_at),
                `"${p.owner}"`,
                p.owner_email
            ]);

            return this.toCSV(headers, rows, 'Data_Produk');
        } catch (error) {
            console.error('[exportService.exportProducts] Error:', error);
            throw error;
        }
    },

    /**
     * Export categories to CSV
     */
    async exportCategories() {
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

            const headers = ['ID', 'Nama Kategori', 'Deskripsi', 'Jumlah Produk'];
            const rows = categories.map(c => [
                c.id,
                `"${c.name}"`,
                `"${c.description || '-'}"`,
                c.product_count
            ]);

            return this.toCSV(headers, rows, 'Data_Kategori');
        } catch (error) {
            console.error('[exportService.exportCategories] Error:', error);
            throw error;
        }
    },

    /**
     * Convert to CSV format with BOM for UTF-8
     */
    toCSV(headers, rows, filename) {
        const BOM = '\uFEFF';
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        return {
            filename: `${filename}_${new Date().toISOString().split('T')[0]}.csv`,
            content: BOM + csvContent
        };
    },

    /**
     * Format date to Indonesian format
     */
    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }
};

module.exports = exportService;
