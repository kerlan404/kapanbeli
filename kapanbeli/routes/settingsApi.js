/**
 * Settings API Routes
 * Base path: /api/settings
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

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

// Apply admin check to all routes
router.use(isAdmin);

/**
 * GET /api/settings
 * Get current settings
 */
router.get('/', async (req, res) => {
    try {
        // For now, return default settings
        // In production, you would store these in a settings table
        res.json({
            success: true,
            data: {
                app_name: 'Kapan Beli',
                support_email: 'support@kapanbeli.id',
                contact_number: '+62 812 3456 7890',
                maintenance_mode: false,
                email_notifications: 'all'
            }
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get settings: ' + error.message
        });
    }
});

/**
 * PUT /api/settings
 * Update settings
 */
router.put('/', async (req, res) => {
    try {
        const { app_name, support_email, contact_number, maintenance_mode, email_notifications } = req.body;

        // Validate input
        if (!app_name || app_name.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Nama aplikasi minimal 3 karakter'
            });
        }

        if (!support_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(support_email)) {
            return res.status(400).json({
                success: false,
                message: 'Email support tidak valid'
            });
        }

        // For now, just return success
        // In production, you would save to database
        res.json({
            success: true,
            message: 'Pengaturan berhasil disimpan',
            data: {
                app_name,
                support_email,
                contact_number,
                maintenance_mode,
                email_notifications
            }
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update settings: ' + error.message
        });
    }
});

module.exports = router;
