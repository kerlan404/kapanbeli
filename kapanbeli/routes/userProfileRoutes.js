/**
 * User Profile Routes
 * Routes untuk halaman detail profil user
 * Base path: /admin/user
 */

const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
};

// Middleware untuk admin only
const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
};

// Apply authentication and admin check to all routes
router.use(isAuthenticated);
router.use(isAdmin);

/**
 * @route GET /admin/user/:id
 * @desc Tampilkan halaman detail profil user
 * @access Private (Admin)
 */
router.get('/:id', userProfileController.showUserProfile);

/**
 * @route GET /admin/user/:id/profile-data
 * @desc API endpoint untuk mendapatkan data profil user (JSON)
 * @access Private (Admin)
 */
router.get('/:id/profile-data', userProfileController.getUserProfileData);

/**
 * @route GET /admin/user/:id/activity
 * @desc API endpoint untuk mendapatkan activity logs user
 * @query {number} limit - Max records (default: 10, max: 100)
 * @query {number} page - Page number (default: 1)
 * @access Private (Admin)
 */
router.get('/:id/activity', userProfileController.getUserActivity);

module.exports = router;
