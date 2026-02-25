const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/'); // Make sure this directory exists
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const suggestionsRoutes = require('./routes/suggestions');
const dashboardRoutes = require('./routes/dashboard');
const dashboardSSRRoutes = require('./routes/dashboardSSR');
const settingsRoutes = require('./routes/settings');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const activityLogsRoutes = require('./routes/activityLogs');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');

// Import controllers for upload routes
const productsController = require('./controllers/productsController');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth');
    }
};

// Authentication guard middleware - redirects authenticated users away from auth pages
const isNotAuthenticated = (req, res, next) => {
    if (!req.session.user) {
        next();
    } else {
        // If user is already authenticated, redirect to appropriate page
        const userRole = req.session.user.role;
        const redirectUrl = userRole === 'admin' ? '/admin' : '/';
        res.redirect(redirectUrl);
    }
};

// Public routes (no authentication required)
app.get('/', async (req, res) => {
    try {
        const userId = req.session.user?.id;
        
        // Default stats (untuk user yang belum login)
        let stats = {
            totalBahan: 0,
            stokMenipis: 0,
            habisStok: 0,
            kadaluarsa: 0,
            hampirKadaluarsa: 0,
            totalCatatan: 0,
            daftarBelanja: 0
        };
        
        // Jika user sudah login, ambil stats dari database
        if (userId) {
            const db = require('./config/database');
            
            // Query stats produk dengan CASE statements (1 query efisien)
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
            const productStats = statsResults[0];
            
            // Query untuk catatan
            const notesQuery = 'SELECT COUNT(*) as total_catatan FROM notes WHERE user_id = ?';
            const [notesResults] = await db.execute(notesQuery, [userId]);
            
            // Query untuk daftar belanja
            const shoppingQuery = `
                SELECT COUNT(*) as daftar_belanja
                FROM products
                WHERE user_id = ?
                AND (stock_quantity <= 0 OR stock_quantity <= 5)
            `;
            const [shoppingResults] = await db.execute(shoppingQuery, [userId]);
            
            // Gabungkan semua stats
            stats = {
                totalBahan: parseInt(productStats.total_bahan) || 0,
                stokMenipis: parseInt(productStats.stok_menipis) || 0,
                habisStok: parseInt(productStats.habis_stok) || 0,
                kadaluarsa: parseInt(productStats.kadaluarsa) || 0,
                hampirKadaluarsa: parseInt(productStats.hampir_kadaluarsa) || 0,
                totalCatatan: parseInt(notesResults[0].total_catatan) || 0,
                daftarBelanja: parseInt(shoppingResults[0].daftar_belanja) || 0
            };
        }
        
        res.render('index', { 
            currentPage: 'home', 
            footerText: 'Semua hak dilindungi.',
            stats: stats,
            user: req.session.user || null
        });
        
    } catch (error) {
        console.error('Index route error:', error);
        // Fallback ke stats 0 jika ada error
        res.render('index', { 
            currentPage: 'home', 
            footerText: 'Semua hak dilindungi.',
            stats: {
                totalBahan: 0,
                stokMenipis: 0,
                habisStok: 0,
                kadaluarsa: 0,
                hampirKadaluarsa: 0,
                totalCatatan: 0,
                daftarBelanja: 0
            }
        });
    }
});

// Serve about page (public)
app.get('/about', (req, res) => {
    res.render('about', { currentPage: 'about', footerText: 'Dibuat dengan ❤️ oleh tim kami.' });
});

// Serve login/register page
app.get('/auth', isNotAuthenticated, (req, res) => {
    // Check for confirmation query parameter
    const confirmed = req.query.confirmed === 'true';
    const returnUrl = req.query.returnUrl || '/';
    res.render('login', { confirmed: confirmed, returnUrl: returnUrl });
});

// Serve register page
app.get('/register', isNotAuthenticated, (req, res) => {
    res.render('register');
});

// Use auth routes
app.use('/auth', authRoutes);

// Use notes routes (protected)
app.use('/api/notes', notesRoutes);

// Use product routes (protected) - Need to handle upload separately
// Import product routes that require upload functionality
app.post('/api/products', upload.single('image'), isAuthenticated, productsController.create);
app.put('/api/products/:id', upload.single('image'), isAuthenticated, productsController.update);

// Use the regular routes for other operations
app.use('/api/products', productRoutes);

// ============================================
// ANALYTICS ENDPOINTS (MUST BE BEFORE /api/admin)
// ============================================
// Public analytics endpoint (for admin dashboard)
app.get('/api/admin/analytics', async (req, res) => {
    try {
        const db = require('./config/database');
        await db.execute("SET time_zone = '+07:00'");
        
        const range = req.query.range || '7days';
        const isToday = range === 'today';
        const days = range === 'month' ? 30 : (range === 'today' ? 1 : 7);
        const interval = days - 1;
        const dateFormat = isToday ? '%H:00' : '%Y-%m-%d';
        
        // Get all data in parallel
        const [
            usersResult,
            loginsResult,
            totalUsersResult,
            totalLoginsResult,
            dauResult,
            prevUsersResult,
            prevLoginsResult
        ] = await Promise.all([
            // Current period users
            db.execute(`
                SELECT DATE_FORMAT(created_at, ?) as period, COUNT(*) as count
                FROM users
                WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE_FORMAT(created_at, ?)
                ORDER BY period ASC
            `, [dateFormat, interval, dateFormat]),
            
            // Current period logins
            db.execute(`
                SELECT DATE_FORMAT(login_at, ?) as period, COUNT(*) as count
                FROM login_logs
                WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                GROUP BY DATE_FORMAT(login_at, ?)
                ORDER BY period ASC
            `, [dateFormat, interval, dateFormat]),
            
            // Total users
            db.execute('SELECT COUNT(*) as count FROM users'),
            
            // Total logins current period
            db.execute(`
                SELECT COUNT(*) as count FROM login_logs
                WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            `, [interval]),
            
            // DAU
            db.execute(`
                SELECT COUNT(DISTINCT user_id) as count FROM login_logs
                WHERE DATE(login_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            `, [interval]),
            
            // Previous period users
            db.execute(`
                SELECT COUNT(*) as count FROM users
                WHERE DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE_SUB(CURDATE(), INTERVAL ? DAY)
            `, [interval + days, interval + 1]),
            
            // Previous period logins
            db.execute(`
                SELECT COUNT(*) as count FROM login_logs
                WHERE DATE(login_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE_SUB(CURDATE(), INTERVAL ? DAY)
            `, [interval + days, interval + 1])
        ]);
        
        // Generate labels
        const labels = [];
        if (isToday) {
            for (let i = 0; i < 24; i++) labels.push(i.toString().padStart(2, '0') + ':00');
        } else {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
            }
        }
        
        // Map data with zero-filling
        const usersMap = new Map(usersResult[0].map(r => [r.period, parseInt(r.count)]));
        const loginsMap = new Map(loginsResult[0].map(r => [r.period, parseInt(r.count)]));
        
        // Helper to get date key from label
        const getDateKey = (label, idx) => {
            if (isToday) return label;
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - idx));
            return d.toISOString().split('T')[0];
        };
        
        const usersData = labels.map((_, i) => {
            const key = getDateKey(_, i);
            return usersMap.get(key) || 0;
        });
        
        const loginsData = labels.map((_, i) => {
            const key = getDateKey(_, i);
            return loginsMap.get(key) || 0;
        });
        
        // Calculate growth
        const currUsers = usersResult[0].reduce((sum, r) => sum + parseInt(r.count), 0);
        const prevUsers = prevUsersResult[0][0].count;
        const currLogins = totalLoginsResult[0][0].count;
        const prevLogins = prevLoginsResult[0][0].count;
        
        const calcGrowth = (prev, curr) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return parseFloat((((curr - prev) / prev) * 100).toFixed(2));
        };
        
        const periodLabels = { today: 'Hari Ini', '7days': '7 Hari Terakhir', month: 'Bulan Ini' };
        
        res.json({
            success: true,
            range: range,
            period: periodLabels[range] || '7 Hari Terakhir',
            timestamp: new Date().toISOString(),
            timezone: 'Asia/Jakarta',
            summary: {
                totalUsers: totalUsersResult[0][0].count,
                totalLogins: currLogins,
                dailyActiveUsers: dauResult[0][0].count,
                newUsers: currUsers,
                growth: {
                    users: {
                        current: currUsers,
                        previous: prevUsers,
                        percentage: calcGrowth(prevUsers, currUsers),
                        trend: currUsers >= prevUsers ? 'up' : 'down'
                    },
                    logins: {
                        current: currLogins,
                        previous: prevLogins,
                        percentage: calcGrowth(prevLogins, currLogins),
                        trend: currLogins >= prevLogins ? 'up' : 'down'
                    }
                }
            },
            chart: {
                labels: labels,
                users: usersData,
                logins: loginsData
            }
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Analytics summary endpoint
app.get('/api/admin/analytics/summary', async (req, res) => {
    try {
        const db = require('./config/database');
        await db.execute("SET time_zone = '+07:00'");
        
        const [totalUsers, todayUsers, todayLogins, dau, onlineUsers] = await Promise.all([
            db.execute('SELECT COUNT(*) as count FROM users'),
            db.execute('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'),
            db.execute('SELECT COUNT(*) as count FROM login_logs WHERE DATE(login_at) = CURDATE()'),
            db.execute('SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_at) = CURDATE()'),
            db.execute('SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE login_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)')
        ]);
        
        res.json({
            success: true,
            data: {
                totalUsers: totalUsers[0][0].count,
                newUsersToday: todayUsers[0][0].count,
                loginsToday: todayLogins[0][0].count,
                dailyActiveUsers: dau[0][0].count,
                onlineUsers: onlineUsers[0][0].count
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ============================================

// Use admin analytics routes (protected) - MUST BE BEFORE /api/admin
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Use admin routes (protected)
app.use('/api/admin', adminRoutes);

// Use activity logs routes (protected)
app.use('/api/activity-logs', activityLogsRoutes);

// Use user management routes (protected)
app.use('/api/users', userRoutes);

// Use user profile routes (protected)
app.use('/admin/user', userProfileRoutes);

// Use admin product routes (protected)
app.use('/admin/products', adminProductRoutes);
app.use('/api/admin/products', adminProductRoutes);

// Use suggestions routes (protected)
app.use('/api/suggestions', suggestionsRoutes);

// Use dashboard routes (protected)
app.use('/api/dashboard', dashboardRoutes);

// Use dashboard SSR routes (page rendering)
app.use('/dashboard', dashboardSSRRoutes);

// Use profile routes (protected)
app.use('/api/profile', settingsRoutes);

// Protected routes
app.get('/notes', isAuthenticated, (req, res) => {
    res.render('notes', { currentPage: 'notes' });
});

// Profile route (replaces settings)
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { currentPage: 'profile' });
});

// Admin routes
app.get('/admin', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-dashboard', { currentPage: 'admin' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/users', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-users', { currentPage: 'users' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/analytics', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-analytics', { currentPage: 'analytics' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/settings', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-dashboard', { currentPage: 'admin' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/user/:id', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-user-profile', { currentPage: 'admin' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Current user's profile page (MUST BE BEFORE /profile/:id)
app.get('/user-profile', isAuthenticated, (req, res) => {
    console.log('User profile page accessed. Session user:', req.session.user);
    res.render('user-profile', { currentPage: 'profile' });
});

// Public user profile page
app.get('/profile/:id', async (req, res) => {
    res.render('user-profile', { currentPage: 'profile' });
});

app.get('/admin/user/:id/products', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-user-profile', { currentPage: 'admin' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/products', isAuthenticated, (req, res) => {
    res.render('products', { currentPage: 'products' });
});

app.get('/products/add', isAuthenticated, (req, res) => {
    res.render('products-add', { currentPage: 'products' });
});

app.get('/products/detail/:id', isAuthenticated, (req, res) => {
    res.render('product-detail', { currentPage: 'products' });
});

app.get('/products/edit/:id', isAuthenticated, (req, res) => {
    res.render('products-add', { currentPage: 'products' }); // Reuse the add page for editing
});

// Legacy route for adding products (can be removed later if using API route exclusively)
// This route is now handled by the API route /api/products POST
// app.post('/products/add', isAuthenticated, (req, res) => {
//     // In a real application, this would save the product to a database
//     // For now, we'll just return a success response
//     const product = req.body;
//
//     // Simulate saving to database
//     console.log('New product added:', product);
//
//     res.json({
//         message: 'Produk berhasil ditambahkan',
//         success: true,
//         product: product
//     });
// });

app.get('/suggestions', isAuthenticated, (req, res) => {
    res.render('suggestions', { currentPage: 'suggestions' });
});

app.get('/stores', isAuthenticated, (req, res) => {
    res.render('stores', { currentPage: 'stores' });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
const errorHandler = require('./middleware/errorHandler');

// 404 handler
app.use(errorHandler.notFound);

// Global error handler (must be last)
app.use(errorHandler.global);

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
    console.log(`Kapan Beli app listening on port ${PORT}`);
});