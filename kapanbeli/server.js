const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Disable view cache in development (reload templates on each request)
if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
}

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
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Favicon handler - prevent 404 errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Chrome DevTools debugging handler - prevent 404 errors
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
    res.status(200).json({ result: 'success' });
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Localization Middleware
const idLocale = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/id.json'), 'utf8'));
const enLocale = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales/en.json'), 'utf8'));

app.use((req, res, next) => {
    // Hardcoded to Indonesian as per user request
    const lang = 'id';
    const translations = idLocale;
    
    // Add translation helper to res.locals for EJS access
    res.locals.__ = (key) => {
        return translations[key] || null;
    };
    res.locals.currentLang = lang;
    next();
});

// Import routes
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const suggestionsRoutes = require('./routes/suggestions');
const dashboardRoutes = require('./routes/dashboard');
const dashboardSSRRoutes = require('./routes/dashboardSSR');
const settingsRoutes = require('./routes/settings');
const settingsApiRoutes = require('./routes/settingsApi');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const userRoutes = require('./routes/userRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminNotesRoutes = require('./routes/adminNotesRoutes');
const adminActivityRoutes = require('./routes/adminActivityRoutes');
const shoppingSuggestionsRoutes = require('./routes/shoppingSuggestionsRoutes');
const expiredRoutes = require('./routes/expiredRoutes');
const broadcastRoutes = require('./routes/broadcastRoutes');
const exportRoutes = require('./routes/exportRoutes');
const announcementsRoutes = require('./routes/announcements');

// Import controllers for upload routes
const productsController = require('./controllers/productsController');

// Middleware untuk mengecek status akun user dari database
const checkUserStatus = async (req, res, next) => {
    // Skip check for API routes to prevent interference
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    if (req.session && req.session.user && req.session.user.id !== 'default_admin') {
        try {
            const db = require('./config/database');
            const [rows] = await db.execute(
                'SELECT account_status, status FROM users WHERE id = ?',
                [req.session.user.id]
            );

            if (rows.length > 0) {
                const userStatus = rows[0];
                const accountStatus = userStatus.account_status || userStatus.status || 'active';

                // If account is disabled, destroy session and redirect
                if (accountStatus === 'inactive' || accountStatus === 'suspended') {
                    req.session.destroy((err) => {
                        if (err) {
                            console.error('Error destroying session for disabled user:', err);
                        }
                        res.clearCookie('connect.sid');
                        return res.redirect('/auth?message=Akun+Anda+telah+dinonaktifkan.+Silakan+hubungi+administrator.');
                    });
                    return;
                }
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            // Continue with request even if status check fails (fail-safe)
        }
    }
    next();
};

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/auth');
    }
};

// DEBUG TEST ROUTE - MUST BE FIRST
app.get('/api/test', (req, res) => {
    console.log('GLOBAL TEST ROUTE HIT!');
    res.json({ success: true, message: 'Server is running!' });
});

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
        const user = req.session.user || null;

        // Default stats (untuk user yang belum login)
        let stats = {
            totalBahan: 0,
            stokMenipis: 0,
            habisStok: 0,
            kadaluarsa: 0,
            hampirKadaluarsa: 0,
            goodStock: 0,
            totalProducts: 0,
            totalCatatan: 0,
            daftarBelanja: 0,
            shoppingList: 0,
            totalNotes: 0
        };

        // Jika user sudah login, ambil data lengkap dari database
        if (userId) {
            const db = require('./config/database');

            // 1. Query stats produk dengan CASE statements
            const statsQuery = `
                SELECT
                    COUNT(DISTINCT p.id) as total_bahan,
                    SUM(CASE WHEN p.stock_quantity > 0 AND p.stock_quantity <= p.min_stock_level THEN 1 ELSE 0 END) as stok_menipis,
                    SUM(CASE WHEN p.stock_quantity <= 0 THEN 1 ELSE 0 END) as habis_stok,
                    SUM(CASE WHEN p.expiry_date IS NOT NULL AND p.expiry_date < CURDATE() THEN 1 ELSE 0 END) as kadaluarsa,
                    SUM(CASE WHEN p.expiry_date IS NOT NULL AND p.expiry_date >= CURDATE() AND p.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as hampir_kadaluarsa,
                    SUM(CASE WHEN p.stock_quantity > p.min_stock_level THEN 1 ELSE 0 END) as good_stock
                FROM products p
                WHERE p.user_id = ?
            `;
            const [statsResults] = await db.execute(statsQuery, [userId]);
            const productStats = statsResults[0];

            // 2. Query untuk catatan (total)
            const notesQuery = 'SELECT COUNT(*) as total_catatan FROM notes WHERE user_id = ?';
            const [notesResults] = await db.execute(notesQuery, [userId]);

            // 3. Query untuk daftar belanja (stok rendah/habis/kadaluarsa/hampir kadaluarsa)
            const shoppingQuery = `
                SELECT COUNT(DISTINCT id) as daftar_belanja
                FROM products
                WHERE user_id = ?
                AND (
                    stock_quantity <= min_stock_level
                    OR (expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY))
                )
            `;
            const [shoppingResults] = await db.execute(shoppingQuery, [userId]);

            // 4. FETCH RECENT ACTIVITY LOGS (DATA ASLI)
            const activityQuery = `
                SELECT activity_type, description, created_at 
                FROM activity_logs 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 8
            `;
            const [dbActivities] = await db.execute(activityQuery, [userId]);

            // 4.5. FETCH URGENT SUGGESTIONS TO INJECT INTO LOG
            const urgentSuggestionsQuery = `
                SELECT name, stock_quantity, min_stock_level, expiry_date,
                    CASE 
                        WHEN stock_quantity <= 0 THEN 'Habis'
                        WHEN stock_quantity <= min_stock_level THEN 'Stok Rendah'
                        WHEN expiry_date < CURDATE() THEN 'Kadaluarsa'
                        ELSE 'Hampir Kadaluarsa'
                    END as alert_type
                FROM products
                WHERE user_id = ?
                AND (
                    stock_quantity <= min_stock_level
                    OR (expiry_date IS NOT NULL AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 3 DAY))
                )
                ORDER BY created_at DESC
                LIMIT 3
            `;
            const [urgentSuggestions] = await db.execute(urgentSuggestionsQuery, [userId]);
            
            // Map suggestions to activity format
            const suggestionActivities = urgentSuggestions.map(s => ({
                activity_type: 'SUGGESTION',
                description: `Saran: ${s.name} (${s.alert_type})`,
                created_at: new Date() // Current time for alerts
            }));

            // Merge and sort by date (alerts always on top or mixed)
            const activities = [...suggestionActivities, ...dbActivities].slice(0, 8);

            // 5. FETCH RECENT NOTES
            const recentNotesQuery = `
                SELECT id, title, content, status, created_at 
                FROM notes 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT 4
            `;
            const [recentNotes] = await db.execute(recentNotesQuery, [userId]);

            // 6. FETCH RECENT PRODUCTS
            const recentProductsQuery = `
                SELECT p.id, p.name, p.stock_quantity, p.unit, p.image_url, c.name as category_name,
                       p.is_deactivated_by_admin, p.deactivated_reason
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT 4
            `;
            const [recentProducts] = await db.execute(recentProductsQuery, [userId]);

            // Gabungkan semua stats
            stats = {
                totalBahan: parseInt(productStats.total_bahan) || 0,
                stokMenipis: parseInt(productStats.stok_menipis) || 0,
                habisStok: parseInt(productStats.habis_stok) || 0,
                kadaluarsa: parseInt(productStats.kadaluarsa) || 0,
                hampirKadaluarsa: parseInt(productStats.hampir_kadaluarsa) || 0,
                goodStock: parseInt(productStats.good_stock) || 0,
                totalProducts: parseInt(productStats.total_bahan) || 0,
                totalCatatan: parseInt(notesResults[0].total_catatan) || 0,
                daftarBelanja: parseInt(shoppingResults[0].daftar_belanja) || 0,
                shoppingList: parseInt(shoppingResults[0].daftar_belanja) || 0,
                totalNotes: parseInt(notesResults[0].total_catatan) || 0
            };

            // Render dengan data lengkap
            return res.render('index', {
                currentPage: 'home',
                stats: stats,
                user: user,
                activities: activities,
                recentNotes: recentNotes,
                recentProducts: recentProducts
            });
        }

        // Render landing page default untuk user yang belum login
        res.render('index', {
            currentPage: 'home',
            stats: stats,
            user: null,
            activities: [],
            recentNotes: [],
            recentProducts: []
        });

    } catch (error) {
        console.error('Index route error:', error);
        // Fallback ke stats 0 jika ada error
        res.render('index', {
            currentPage: 'home',
            stats: {
                totalBahan: 0,
                stokMenipis: 0,
                habisStok: 0,
                kadaluarsa: 0,
                hampirKadaluarsa: 0,
                goodStock: 0,
                totalProducts: 0,
                totalCatatan: 0,
                daftarBelanja: 0,
                shoppingList: 0,
                totalNotes: 0
            },
            user: null
        });
    }
});

// Serve about page (public)
app.get('/about', (req, res) => {
    res.render('about', { 
        currentPage: 'about', 
        footerText: 'Dibuat dengan ❤️ oleh tim kami.',
        user: req.session.user 
    });
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

// Apply user status check middleware for all authenticated routes
// This ensures disabled users are logged out automatically
app.use((req, res, next) => {
    // Skip status check for auth routes and public routes
    const publicPaths = ['/auth', '/register', '/api/auth'];
    const isPublicPath = publicPaths.some(path => req.path.startsWith(path));

    if (!isPublicPath && req.session && req.session.user) {
        // Apply checkUserStatus middleware
        checkUserStatus(req, res, next);
    } else {
        next();
    }
});

// Use notes routes (protected)
app.use('/api/notes', notesRoutes);

// Use product routes (protected) - Need to handle upload separately
// Import product routes that require upload functionality
app.post('/api/products', upload.single('image'), isAuthenticated, productsController.create);
app.put('/api/products/:id', upload.single('image'), isAuthenticated, productsController.update);

// Use the regular routes for other operations
app.use('/api/products', productRoutes);

// Use admin analytics routes (protected)
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Use admin notes routes (protected)
app.use('/api/admin/notes', adminNotesRoutes);

// DEBUG: Direct route test
app.get('/api/admin/activity-logs/test', (req, res) => {
    console.log('TEST ROUTE HIT!');
    res.json({ success: true, message: 'Test route works!' });
});

// Use admin activity routes (protected) - MUST be before /api/admin to avoid conflicts
console.log('Registering route: /api/admin/activity-logs');
app.use('/api/admin/activity-logs', adminActivityRoutes);
// Alias for backward compatibility
app.use('/api/admin/activity', adminActivityRoutes);

// Use activity logs routes (protected) - For dashboard activity section
const activityLogsRoutes = require('./routes/activityLogs');
app.use('/api/activity-logs', activityLogsRoutes);

// Use admin product routes (protected) - MUST be before /api/admin
app.use('/api/admin/products', adminProductRoutes);

// Use shopping suggestions routes (protected) - MUST be before /api/admin
app.use('/api/admin/shopping-suggestions', shoppingSuggestionsRoutes);

// Use admin routes (protected) - MUST be last to avoid catching other routes
console.log('Registering route: /api/admin (catch-all)');
app.use('/api/admin', adminRoutes);

// Use user management routes (protected)
app.use('/api/users', userRoutes);

// Use user profile routes (protected)
app.use('/admin/user', userProfileRoutes);

// Use admin product routes (protected)
// PENTING: Route VIEW harus terpisah dari route API!
app.get('/admin/products', isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-products', {
            currentPage: 'products',
            pageTitle: 'Manajemen Produk',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Admin broadcast route
app.get('/admin/broadcast', isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-broadcast', {
            currentPage: 'broadcast',
            pageTitle: 'Broadcast Pengumuman',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Shopping suggestions routes
app.get('/admin/shopping-suggestions', isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-shopping-suggestions', {
            currentPage: 'shopping-suggestions',
            pageTitle: 'Saran Pembelian',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Use suggestions routes (protected)
app.use('/api/suggestions', suggestionsRoutes);

// Use dashboard routes (protected)
app.use('/api/dashboard', dashboardRoutes);

// Use dashboard SSR routes (page rendering)
app.use('/dashboard', dashboardSSRRoutes);

// Use profile routes (protected)
app.use('/api/profile', settingsRoutes);

// Use settings API routes (protected)
app.use('/api/settings', settingsApiRoutes);

// New feature routes (API only - page routes are defined above)
app.use('/admin/api', expiredRoutes);
app.use('/api/admin', broadcastRoutes);
app.use('/api/admin', exportRoutes);
app.use('/api/announcements', announcementsRoutes);

// Theme update API
app.put('/api/settings/theme', isAuthenticated, async (req, res) => {
    try {
        const { theme } = req.body;
        if (!['light', 'dark'].includes(theme)) {
            return res.status(400).json({ success: false, message: 'Tema tidak valid' });
        }

        const User = require('./models/User');
        await User.updateTheme(req.session.user.id, theme);
        
        // Update session
        req.session.user.theme = theme;
        req.session.save();

        res.json({ success: true, theme: theme });
    } catch (error) {
        console.error('Theme update error:', error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui tema' });
    }
});

// Protected routes
app.get('/notes', isAuthenticated, (req, res) => {
    res.render('notes', { 
        currentPage: 'notes',
        user: req.session.user 
    });
});

app.get('/inbox', isAuthenticated, (req, res) => {
    res.render('inbox', { 
        currentPage: 'inbox',
        user: req.session.user
    });
});

// Profile route (replaces settings)
app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { 
        currentPage: 'profile',
        user: req.session.user
    });
});

// Admin routes
app.get('/admin', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-dashboard', {
            currentPage: 'dashboard',
            user: req.session.user,
            title: 'Dashboard'
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/users', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-users', {
            currentPage: 'users',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/products', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-products', {
            currentPage: 'products',
            user: req.session.user,
            title: 'Manajemen Produk'
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});


app.get('/admin/settings', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-settings', {
            currentPage: 'settings',
            user: req.session.user,
            title: 'Pengaturan Sistem'
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/notes', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-notes', {
            currentPage: 'notes',
            user: req.session.user,
            title: 'Manajemen Catatan'
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/activity-logs', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-activity-logs', {
            currentPage: 'activity-logs',
            user: req.session.user,
            title: 'Log Aktivitas User'
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Expired Watch Page
app.get('/admin/expired-watch', isAuthenticated, (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-expired-watch', {
            currentPage: 'expired-watch',
            user: req.session.user,
            title: 'Monitoring Kadaluarsa'
        });
    } else {
        // Redirect to auth if not admin
        req.session.destroy(() => res.redirect('/auth'));
    }
});

app.get('/admin/user/:id', isAuthenticated, async (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        try {
            const userId = req.params.id;
            
            // Fetch user data
            const User = require('./models/User');
            const user = await User.findByIdWithDetails(userId);
            
            if (!user) {
                return res.status(404).send('User not found');
            }
            
            // Fetch activity logs
            const activityLogs = await User.getLoginLogs(userId, 10);
            
            res.render('admin-user-profile', { 
                currentPage: 'admin',
                user: user,
                activityLogs: activityLogs
            });
        } catch (error) {
            console.error('Error loading user profile:', error);
            res.status(500).send('Error loading user profile');
        }
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

// Current user's profile page (MUST BE BEFORE /profile/:id)
app.get('/user-profile', isAuthenticated, async (req, res) => {
    console.log('User profile page accessed. Session user:', req.session.user);
    
    try {
        const userProfileService = require('./services/userProfileService');
        const userId = req.session.user.id;
        console.log('[user-profile] Fetching data for user ID:', userId);
        
        // Fetch real data from database
        const [suggestions, activityLogs, notes, loginLogs] = await Promise.all([
            // Get shopping suggestions (products needing restock)
            (async () => {
                const suggestions = await userProfileService.getUserSuggestions(userId);
                console.log('[user-profile] Suggestions count:', suggestions ? suggestions.length : 0);
                console.log('[user-profile] Suggestions data:', suggestions);
                return suggestions || [];
            })(),
            // Get activity logs
            (async () => {
                const logs = await userProfileService.getUserActivityLogs(userId, 20);
                console.log('[user-profile] Activity logs count:', logs ? logs.length : 0);
                return logs || [];
            })(),
            // Get notes
            (async () => {
                const userNotes = await userProfileService.getUserNotes(userId);
                console.log('[user-profile] Notes count:', userNotes ? userNotes.length : 0);
                return userNotes || [];
            })(),
            // Get login logs
            (async () => {
                const db = require('./config/database');
                const [rows] = await db.execute(
                    `SELECT login_time, ip_address, activity_type 
                     FROM login_logs 
                     WHERE user_id = ? 
                     ORDER BY login_time DESC 
                     LIMIT 20`,
                    [userId]
                );
                console.log('[user-profile] Login logs count:', rows ? rows.length : 0);
                return rows || [];
            })()
        ]);
        
        console.log('[user-profile] Rendering page with data:', {
            suggestions: suggestions.length,
            activityLogs: activityLogs.length,
            notes: notes.length,
            loginLogs: loginLogs.length
        });
        
        res.render('user-profile', {
            currentPage: 'profile',
            user: req.session.user,
            suggestions: suggestions || [],
            activityLogs: activityLogs || [],
            notes: notes || [],
            loginLogs: loginLogs || []
        });
    } catch (error) {
        console.error('[user-profile] Error loading user profile data:', error);
        // Still render page even if data fetch fails
        res.render('user-profile', {
            currentPage: 'profile',
            user: req.session.user,
            suggestions: [],
            activityLogs: [],
            notes: [],
            loginLogs: []
        });
    }
});

// Public user profile page
app.get('/profile/:id', async (req, res) => {
    res.render('user-profile', { currentPage: 'profile' });
});

app.get('/admin/user/:id/products', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-user-profile', { 
            currentPage: 'admin',
            user: req.session.user
        });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/products', isAuthenticated, (req, res) => {
    res.render('products', { 
        currentPage: 'products',
        user: req.session.user
    });
});

app.get('/products/add', isAuthenticated, (req, res) => {
    res.render('products-add', { 
        currentPage: 'products',
        user: req.session.user
    });
});

app.get('/products/detail/:id', isAuthenticated, (req, res) => {
    res.render('product-detail', { 
        currentPage: 'products',
        user: req.session.user
    });
});

app.get('/products/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const ProductModel = require('./models/Product');
        const product = await ProductModel.getByIdAndUserId(req.params.id, req.session.user.id);
        
        if (!product) {
            return res.status(404).send(`
                <html>
                <head><title>Produk Tidak Ditemukan</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1>Produk Tidak Ditemukan</h1>
                    <p>Produk yang Anda cari tidak ada.</p>
                    <a href="/products">Kembali ke Bahan Saya</a>
                </body>
                </html>
            `);
        }

        // Check if product is deactivated by admin
        if (product.is_deactivated_by_admin === 1 || product.is_deactivated_by_admin === true) {
            return res.status(403).send(`
                <html>
                <head>
                    <title>Produk Dinonaktifkan</title>
                    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
                </head>
                <body style="font-family: 'Poppins', sans-serif; text-align: center; padding: 50px; background: #f5f5f5;">
                    <div style="max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #FF6B6B; margin-bottom: 20px;"></i>
                        <h1 style="color: #FF6B6B; margin-bottom: 10px;">Produk Dinonaktifkan oleh Admin</h1>
                        <p style="color: #636E72; margin-bottom: 20px;">Produk <strong>"${product.name}"</strong> telah dinonaktifkan oleh admin.</p>
                        ${product.deactivated_reason ? `
                            <div style="background: rgba(255, 107, 107, 0.1); border-left: 3px solid #FF6B6B; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                                <strong style="color: #FF6B6B;">Alasan:</strong>
                                <p style="color: #FF6B6B; margin: 5px 0 0 0;">${product.deactivated_reason}</p>
                            </div>
                        ` : ''}
                        <p style="color: #636E72; font-size: 0.9rem; margin-bottom: 30px;">
                            <i class="fas fa-clock"></i> Menunggu konfirmasi admin untuk mengaktifkan kembali
                        </p>
                        <a href="/products" style="background: #2E86DE; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
                            <i class="fas fa-arrow-left"></i> Kembali ke Bahan Saya
                        </a>
                    </div>
                </body>
                </html>
            `);
        }

        res.render('products-add', { 
            currentPage: 'products',
            user: req.session.user
        }); // Reuse the add page for editing
    } catch (error) {
        console.error('Error checking product deactivation:', error);
        res.status(500).send('Terjadi kesalahan server');
    }
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
    res.render('suggestions', { 
        currentPage: 'suggestions',
        user: req.session.user
    });
});

app.get('/stores', isAuthenticated, (req, res) => {
    res.render('stores', { 
        currentPage: 'stores',
        user: req.session.user
    });
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