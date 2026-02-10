const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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

// Authentication middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/auth');
    }
};

// Public routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve login/register page
app.get('/auth', (req, res) => {
    // Check for confirmation query parameter
    const confirmed = req.query.confirmed === 'true';
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
    // Note: We cannot pass 'confirmed' variable directly here without a view engine like EJS
    // The client-side JavaScript in login.html will handle displaying the message
});

// Use auth routes
app.use('/auth', authRoutes);

// Use notes routes (protected)
app.use('/api/notes', notesRoutes);

// Use product routes (protected)
app.use('/api/products', productRoutes);

// Protected routes
app.get('/notes', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'notes.html'));
});

app.get('/products', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products.html'));
});

app.get('/products/add', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'products-add.html'));
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
    res.sendFile(path.join(__dirname, 'views', 'suggestions.html'));
});

app.get('/stores', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'stores.html'));
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