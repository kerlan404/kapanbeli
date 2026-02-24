/**
 * Dashboard Controller (Server-Side Rendering)
 * Menghitung statistik dashboard langsung dari database saat render
 */

const db = require('../config/database');

const dashboardController = {
    /**
     * GET /dashboard
     * Render halaman dashboard dengan statistik dari database
     * 
     * Data dikirim langsung saat server render EJS
     * Angka otomatis update setiap kali halaman di-refresh
     */
    async getDashboard(req, res) {
        try {
            const userId = req.session.user?.id;

            // Validasi: User harus login
            if (!userId) {
                return res.redirect('/auth?returnUrl=/dashboard');
            }

            // OPTIMIZED QUERY: Hitung semua stats dalam 1 query
            // Menggunakan CASE statements untuk efisiensi
            const statsQuery = `
                SELECT 
                    -- Total Bahan
                    COUNT(DISTINCT p.id) as total_bahan,
                    
                    -- Stok Menipis (stok <= 5)
                    SUM(CASE 
                        WHEN p.stock_quantity > 0 
                             AND p.stock_quantity <= 5 
                        THEN 1 
                        ELSE 0 
                    END) as stok_menipis,
                    
                    -- Habis Stok (stok = 0)
                    SUM(CASE 
                        WHEN p.stock_quantity <= 0 
                        THEN 1 
                        ELSE 0 
                    END) as habis_stok,
                    
                    -- Kadaluarsa (tanggal < hari ini)
                    SUM(CASE 
                        WHEN p.expiry_date IS NOT NULL 
                             AND p.expiry_date < CURDATE() 
                        THEN 1 
                        ELSE 0 
                    END) as kadaluarsa,
                    
                    -- Hampir Kadaluarsa (0 <= hari <= 3 dari sekarang)
                    SUM(CASE 
                        WHEN p.expiry_date IS NOT NULL 
                             AND p.expiry_date >= CURDATE()
                             AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
                        THEN 1 
                        ELSE 0 
                    END) as hampir_kadaluarsa
                    
                FROM products p
                WHERE p.user_id = ?
            `;

            // Eksekusi query stats (prepared statement)
            const [statsResults] = await db.execute(statsQuery, [userId]);
            const stats = statsResults[0];

            // Query terpisah untuk total catatan (tabel berbeda)
            const notesQuery = `
                SELECT COUNT(*) as total_catatan 
                FROM notes 
                WHERE user_id = ?
            `;
            const [notesResults] = await db.execute(notesQuery, [userId]);
            const totalCatatan = notesResults[0].total_catatan;

            // Query untuk daftar belanja (produk yang perlu dibeli)
            const shoppingListQuery = `
                SELECT COUNT(*) as daftar_belanja
                FROM products
                WHERE user_id = ?
                AND (
                    stock_quantity <= 0 
                    OR (stock_quantity > 0 AND stock_quantity <= 5)
                )
            `;
            const [shoppingListResults] = await db.execute(shoppingListQuery, [userId]);
            const daftarBelanja = shoppingListResults[0].daftar_belanja;

            // Gabungkan semua stats
            const dashboardStats = {
                totalBahan: parseInt(stats.total_bahan) || 0,
                stokMenipis: parseInt(stats.stok_menipis) || 0,
                habisStok: parseInt(stats.habis_stok) || 0,
                kadaluarsa: parseInt(stats.kadaluarsa) || 0,
                hampirKadaluarsa: parseInt(stats.hampir_kadaluarsa) || 0,
                totalCatatan: parseInt(totalCatatan) || 0,
                daftarBelanja: parseInt(daftarBelanja) || 0
            };

            // Query untuk recent products (opsional, untuk ditampilkan di dashboard)
            const recentProductsQuery = `
                SELECT 
                    p.id,
                    p.name,
                    p.stock_quantity,
                    p.min_stock_level,
                    p.expiry_date,
                    p.unit,
                    p.created_at,
                    CASE 
                        WHEN p.stock_quantity <= 0 THEN 'out_of_stock'
                        WHEN p.stock_quantity <= 5 THEN 'low_stock'
                        WHEN p.expiry_date < CURDATE() THEN 'expired'
                        WHEN p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 'expiring_soon'
                        ELSE 'normal'
                    END as status
                FROM products p
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT 10
            `;
            const [recentProducts] = await db.execute(recentProductsQuery, [userId]);

            // Render EJS dengan data stats
            res.render('dashboard', {
                currentPage: 'dashboard',
                user: req.session.user,
                stats: dashboardStats,
                recentProducts: recentProducts,
                pageTitle: 'Dashboard - Ringkasan Dapur',
                lastUpdated: new Date().toLocaleString('id-ID')
            });

        } catch (error) {
            console.error('Dashboard error:', error);
            
            // Handle error dengan graceful fallback
            res.render('dashboard', {
                currentPage: 'dashboard',
                user: req.session.user,
                stats: {
                    totalBahan: 0,
                    stokMenipis: 0,
                    habisStok: 0,
                    kadaluarsa: 0,
                    hampirKadaluarsa: 0,
                    totalCatatan: 0,
                    daftarBelanja: 0
                },
                recentProducts: [],
                pageTitle: 'Dashboard - Error',
                errorMessage: 'Gagal memuat statistik dashboard. Silakan refresh halaman.',
                lastUpdated: new Date().toLocaleString('id-ID')
            });
        }
    },

    /**
     * GET /dashboard/refresh
     * Endpoint AJAX untuk refresh stats tanpa reload halaman
     * (Opsional, untuk UX yang lebih baik)
     */
    async refreshStats(req, res) {
        try {
            const userId = req.session.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }

            // Re-use query dari getDashboard
            const statsQuery = `
                SELECT 
                    COUNT(DISTINCT p.id) as total_bahan,
                    SUM(CASE WHEN p.stock_quantity > 0 AND p.stock_quantity <= 5 THEN 1 ELSE 0 END) as stok_menipis,
                    SUM(CASE WHEN p.stock_quantity <= 0 THEN 1 ELSE 0 END) as habis_stok,
                    SUM(CASE WHEN p.expiry_date IS NOT NULL AND p.expiry_date < CURDATE() THEN 1 ELSE 0 END) as kadaluarsa,
                    SUM(CASE WHEN p.expiry_date IS NOT NULL AND p.expiry_date >= CURDATE() AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY) THEN 1 ELSE 0 END) as hampir_kadaluarsa
                FROM products p
                WHERE p.user_id = ?
            `;

            const [statsResults] = await db.execute(statsQuery, [userId]);
            const stats = statsResults[0];

            const notesQuery = 'SELECT COUNT(*) as total_catatan FROM notes WHERE user_id = ?';
            const [notesResults] = await db.execute(notesQuery, [userId]);

            const shoppingListQuery = `
                SELECT COUNT(*) as daftar_belanja
                FROM products
                WHERE user_id = ?
                AND (stock_quantity <= 0 OR stock_quantity <= 5)
            `;
            const [shoppingListResults] = await db.execute(shoppingListQuery, [userId]);

            const dashboardStats = {
                totalBahan: parseInt(stats.total_bahan) || 0,
                stokMenipis: parseInt(stats.stok_menipis) || 0,
                habisStok: parseInt(stats.habis_stok) || 0,
                kadaluarsa: parseInt(stats.kadaluarsa) || 0,
                hampirKadaluarsa: parseInt(stats.hampir_kadaluarsa) || 0,
                totalCatatan: parseInt(notesResults[0].total_catatan) || 0,
                daftarBelanja: parseInt(shoppingListResults[0].daftar_belanja) || 0
            };

            res.json({
                success: true,
                stats: dashboardStats,
                lastUpdated: new Date().toLocaleString('id-ID')
            });

        } catch (error) {
            console.error('Refresh stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Gagal refresh stats',
                error: error.message
            });
        }
    }
};

module.exports = dashboardController;
