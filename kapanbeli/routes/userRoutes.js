/**
 * User Routes
 * All routes related to user management
 * Base path: /api/users
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const errorHandler = require('../middleware/errorHandler');

// Import multer for file upload
const multer = require('multer');
const path = require('path');

// Configure multer for profile images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Hanya file gambar (jpeg, jpg, png, gif, webp) yang diperbolehkan'));
        }
    }
});

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    console.log('[isAuthenticated] Session:', req.session ? 'exists' : 'null');
    console.log('[isAuthenticated] Session user:', req.session?.user || 'no user');
    console.log('[isAuthenticated] Session ID:', req.sessionID);
    
    if (req.session && req.session.user) {
        console.log('[isAuthenticated] User authenticated:', req.session.user.email, 'Role:', req.session.user.role);
        next();
    } else {
        console.error('[isAuthenticated] Authentication failed - no session or user');
        return errorHandler.unauthorized(res, 'Authentication required. Please login as admin.');
    }
};

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    console.log('[isAdmin] Checking admin role. Current role:', req.session?.user?.role);
    
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        console.log('[isAdmin] User is admin. Access granted.');
        next();
    } else {
        console.error('[isAdmin] Access denied. User role:', req.session?.user?.role);
        return errorHandler.forbidden(res, 'Access denied. Admin only.');
    }
};

// Apply authentication to all routes
router.use((req, res, next) => {
    console.log('[userRoutes] Incoming request:', req.method, req.path);
    console.log('[userRoutes] Session exists:', !!req.session);
    console.log('[userRoutes] Session user:', req.session?.user);
    next();
});

router.use(isAuthenticated);
router.use(isAdmin);

/**
 * @route GET /api/users
 * @desc Get all users with pagination, search, and filters
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} search - Search by name or email
 * @query {string} status - Filter by status (active, inactive, suspended)
 * @query {string} role - Filter by role (admin, user)
 * @query {string} sortBy - Sort column (id, name, email, created_at, last_login)
 * @query {string} sortOrder - Sort order (ASC, DESC)
 */
router.get('/', userController.getAllUsers);

/**
 * @route GET /api/users/statistics
 * @desc Get user statistics
 */
router.get('/statistics', userController.getStatistics);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID with statistics
 */
router.get('/:id', userController.getUserById);

/**
 * @route GET /api/users/:id/data
 * @desc Get user's data (products, suggestions, notes)
 */
router.get('/:id/data', userController.getUserData);

/**
 * @route GET /api/users/:id/login-history
 * @desc Get user's login history
 * @query {number} limit - Limit results (default: 10)
 */
router.get('/:id/login-history', userController.getUserLoginHistory);

/**
 * @route POST /api/users
 * @desc Create new user
 * @body {string} name - User name
 * @body {string} email - User email
 * @body {string} password - User password
 * @body {string} role - User role (optional, default: user)
 */
router.post('/', userController.createUser);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @body {string} name - User name
 * @body {string} email - User email
 * @body {string} role - User role
 * @body {string} account_status - Account status
 */
router.put('/:id', userController.updateUser);

/**
 * @route PUT /api/users/:id/password
 * @desc Update user password
 * @body {string} password - New password
 */
router.put('/:id/password', userController.updatePassword);

/**
 * @route POST /api/users/:id/profile-image
 * @desc Upload profile image
 * @multipart/form-data {file} profileImage - Profile image file
 */
router.post('/:id/profile-image', upload.single('profileImage'), userController.uploadProfileImage);

/**
 * @route PATCH /api/users/:id/toggle-status
 * @desc Toggle user status (active/inactive)
 */
router.patch('/:id/toggle-status', userController.toggleUserStatus);

/**
 * @route DELETE /api/users/:id
 * @desc Soft delete user (set to inactive)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route DELETE /api/users/:id/permanent
 * @desc Hard delete user (permanent)
 */
router.delete('/:id/permanent', userController.hardDeleteUser);

module.exports = router;
