/**
 * Dashboard Controller
 * Menghandle semua statistik dashboard dengan query yang efisien
 */

const db = require('../config/database');

const dashboardController = {
    /**
     * GET /api/dashboard/stats
     * Mengambil semua statistik dashboard dalam SATU query efisien
     * 
     * Response JSON:
     * {
     *   success: true,
     *   stats: {
     *     totalProducts: number,
     *     lowStock: number,
     *     outOfStock: number,
     *     shoppingList: number,
     *     expired: number,
     *     expiringSoon: number,
     *     totalNotes: number,
     *     totalUsers: number
     *   },
     *   lastUpdated: timestamp
     * }
     */
    async getStats(req, res) {
        try {
            const userId = req.session.user?.id;

            // Validasi: User harus login
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login terlebih dahulu.'
                });
            }

            // OPTIMIZED QUERY: Menggunakan CASE statements untuk menghitung semua stats dalam 1 query
            // Ini lebih efisien daripada melakukan 6-7 query terpisah
            const query = `
                SELECT 
                    -- Total Produk
                    COUNT(DISTINCT p.id) as total_products,
                    
                    -- Stok Menipis (stok <= min_stock_level AND stok > 0)
                    SUM(CASE 
                        WHEN p.stock_quantity > 0 
                             AND p.stock_quantity <= p.min_stock_level 
                        THEN 1 
                        ELSE 0 
                    END) as low_stock,
                    
                    -- Habis Stok (stok = 0)
                    SUM(CASE 
                        WHEN p.stock_quantity <= 0 
                        THEN 1 
                        ELSE 0 
                    END) as out_of_stock,
                    
                    -- Kadaluarsa (tanggal < hari ini)
                    SUM(CASE 
                        WHEN p.expiry_date IS NOT NULL 
                             AND p.expiry_date < CURDATE() 
                        THEN 1 
                        ELSE 0 
                    END) as expired,
                    
                    -- Hampir Kadaluarsa (0 < hari <= 7 hari dari sekarang)
                    SUM(CASE 
                        WHEN p.expiry_date IS NOT NULL 
                             AND p.expiry_date >= CURDATE()
                             AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                        THEN 1 
                        ELSE 0 
                    END) as expiring_soon
                    
                FROM products p
                WHERE p.user_id = ?
            `;

            // Eksekusi query untuk products
            const [productsStats] = await db.execute(query, [userId]);
            
            // Query terpisah untuk notes (karena tabel berbeda)
            const notesQuery = `
                SELECT COUNT(*) as total_notes 
                FROM notes 
                WHERE user_id = ?
            `;
            const [notesStats] = await db.execute(notesQuery, [userId]);

            // Query untuk shopping list items (produk yang perlu dibeli)
            // Shopping list = low stock + out of stock
            const shoppingListQuery = `
                SELECT COUNT(*) as shopping_list
                FROM products
                WHERE user_id = ?
                AND (
                    stock_quantity <= 0 
                    OR (stock_quantity > 0 AND stock_quantity <= min_stock_level)
                )
            `;
            const [shoppingListStats] = await db.execute(shoppingListQuery, [userId]);

            // Gabungkan semua hasil
            const stats = {
                totalProducts: parseInt(productsStats[0].total_products) || 0,
                lowStock: parseInt(productsStats[0].low_stock) || 0,
                outOfStock: parseInt(productsStats[0].out_of_stock) || 0,
                shoppingList: parseInt(shoppingListStats[0].shopping_list) || 0,
                expired: parseInt(productsStats[0].expired) || 0,
                expiringSoon: parseInt(productsStats[0].expiring_soon) || 0,
                totalNotes: parseInt(notesStats[0].total_notes) || 0,
                totalUsers: 1 // Untuk single user, atau bisa query ke users table
            };

            // Response yang clean dan terstruktur
            res.status(200).json({
                success: true,
                stats: stats,
                lastUpdated: new Date().toISOString(),
                message: 'Statistik dashboard berhasil diambil'
            });

        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan saat mengambil statistik dashboard.',
                error: error.message
            });
        }
    },

    /**
     * GET /api/dashboard/quick-stats
     * Versi lebih ringan untuk quick refresh (hanya stats penting)
     */
    async getQuickStats(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak. Silakan login.'
                });
            }

            // Query lebih ringkas untuk quick stats
            const query = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_products,
                    SUM(CASE 
                        WHEN p.stock_quantity <= 0 
                             OR (p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level)
                        THEN 1 
                        ELSE 0 
                    END) as needs_attention,
                    SUM(CASE 
                        WHEN p.expiry_date IS NOT NULL 
                             AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                        THEN 1 
                        ELSE 0 
                    END) as urgent_expiry
                FROM products p
                WHERE p.user_id = ?
            `;

            const [results] = await db.execute(query, [userId]);

            const stats = {
                totalProducts: parseInt(results[0].total_products) || 0,
                needsAttention: parseInt(results[0].needs_attention) || 0,
                urgentExpiry: parseInt(results[0].urgent_expiry) || 0
            };

            res.status(200).json({
                success: true,
                stats: stats,
                lastUpdated: new Date().toISOString()
            });

        } catch (error) {
            console.error('Quick stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan.',
                error: error.message
            });
        }
    },

    /**
     * GET /api/dashboard/alerts
     * Mendapatkan daftar produk yang butuh perhatian (stok rendah/kadaluarsa)
     */
    async getAlerts(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Akses ditolak.'
                });
            }

            // Query untuk mendapatkan produk yang butuh perhatian
            const query = `
                SELECT 
                    p.id,
                    p.name,
                    p.stock_quantity,
                    p.min_stock_level,
                    p.expiry_date,
                    p.unit,
                    CASE 
                        WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                        WHEN p.stock_quantity <= p.min_stock_level THEN 'low_stock'
                        WHEN p.expiry_date < CURDATE() THEN 'expired'
                        WHEN p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'expiring_soon'
                    END as alert_type,
                    CASE 
                        WHEN p.stock_quantity <= 0 THEN 'Habis'
                        WHEN p.stock_quantity <= p.min_stock_level THEN 'Stok Rendah'
                        WHEN p.expiry_date < CURDATE() THEN 'Kadaluarsa'
                        WHEN p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Hampir Kadaluarsa'
                    END as alert_label
                FROM products p
                WHERE p.user_id = ?
                AND (
                    p.stock_quantity <= p.min_stock_level
                    OR p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
                )
                ORDER BY 
                    CASE 
                        WHEN p.stock_quantity <= 0 THEN 1
                        WHEN p.expiry_date < CURDATE() THEN 2
                        WHEN p.stock_quantity <= p.min_stock_level THEN 3
                        ELSE 4
                    END,
                    p.expiry_date ASC
                LIMIT 20
            `;

            const [alerts] = await db.execute(query, [userId]);

            res.status(200).json({
                success: true,
                alerts: alerts,
                count: alerts.length
            });

        } catch (error) {
            console.error('Get alerts error:', error);
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan.',
                error: error.message
            });
        }
    }
};

module.exports = dashboardController;
