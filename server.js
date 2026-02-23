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

// Public routes
app.get('/', (req, res) => {
    res.render('index', { currentPage: 'home', footerText: 'Semua hak dilindungi.' });
});

// Serve about page
app.get('/about', (req, res) => {
    res.render('about', { currentPage: 'about', footerText: 'Dibuat dengan ❤️ oleh tim kami.' });
});

// Serve login/register page
app.get('/auth', isNotAuthenticated, (req, res) => {
    // Check for confirmation query parameter
    const confirmed = req.query.confirmed === 'true';
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
    // Note: We cannot pass 'confirmed' variable directly here without a view engine like EJS
    // The client-side JavaScript in login.html will handle displaying the message
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

// Use admin routes (protected)
app.use('/api/admin', adminRoutes);

// Protected routes
app.get('/notes', isAuthenticated, (req, res) => {
    res.render('notes', { currentPage: 'notes' });
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
        res.render('admin-dashboard', { currentPage: 'admin' });
    } else {
        res.status(403).send('Access denied. Admins only.');
    }
});

app.get('/admin/analytics', isAuthenticated, (req, res) => {
    // Check if user is admin
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('admin-dashboard', { currentPage: 'admin' });
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

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <html>
        <head>
            <title>404 - Page Not Found</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background-color: #f5f5f5;
                }
                .container {
                    text-align: center;
                    padding: 20px;
                }
                h1 {
                    color: #333;
                    font-size: 72px;
                    margin: 0;
                }
                h2 {
                    color: #666;
                    font-size: 24px;
                    margin: 10px 0;
                }
                a {
                    color: #007bff;
                    text-decoration: none;
                    font-size: 18px;
                }
                a:hover {
                    text-decoration: underline;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
                <a href="/">Go back to home</a>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Kapan Beli app listening on port ${PORT}`);
});