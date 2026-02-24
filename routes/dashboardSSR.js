/**
 * Dashboard Routes (Server-Side Rendering)
 * Route untuk halaman dashboard dengan stats dari database
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardSSRController');

/**
 * @route   GET /dashboard
 * @desc    Render halaman dashboard dengan statistik dari database
 * @access  Private (requires login)
 * 
 * Data stats dihitung saat server render EJS
 * Setiap kali halaman di-refresh, angka otomatis update dari database
 */
router.get('/', dashboardController.getDashboard);

/**
 * @route   GET /dashboard/refresh
 * @desc    Endpoint AJAX untuk refresh stats tanpa reload (opsional)
 * @access  Private
 */
router.get('/refresh', dashboardController.refreshStats);

module.exports = router;
