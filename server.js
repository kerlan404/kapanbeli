const express = require('express');
const path = require('path');
const session = require('express-session');
const multer = require('multer');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

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
const adminNotesRoutes = require('./routes/adminNotesRoutes');
const adminActivityRoutes = require('./routes/adminActivityRoutes');
const shoppingSuggestionsRoutes = require('./routes/shoppingSuggestionsRoutes');

// Import controllers for upload routes
const productsController = require('./controllers/productsController');

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
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
app.get('/auth', (req, res) => {
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

// Use admin analytics routes (protected)
app.use('/api/admin/analytics', adminAnalyticsRoutes);

// Use admin notes routes (protected)
app.use('/api/admin/notes', adminNotesRoutes);

// Use admin activity routes (protected)
app.use('/api/admin/activity', adminActivityRoutes);

// Use admin routes (protected)
app.use('/api/admin', adminRoutes);

// Use activity logs routes (protected)
app.use('/api/activity-logs', activityLogsRoutes);
// Alias for admin panel compatibility
app.use('/api/admin/activity-logs', activityLogsRoutes);

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
// API routes untuk products (return JSON)
app.use('/api/admin/products', adminProductRoutes);

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
app.use('/api/admin/shopping-suggestions', shoppingSuggestionsRoutes);

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
        res.render('admin-dashboard', {
            currentPage: 'dashboard',
            user: req.session.user,
            title: 'Dashboard',
            stats: {}  // Empty stats - will be loaded via AJAX
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

app.get('/admin/notes', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-notes', { currentPage: 'notes' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/activity-logs', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-activity-logs', { currentPage: 'activity-logs' });
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