const express = require('express');
const router = express.Router();
const suggestionsController = require('../controllers/suggestionsController');

// Middleware untuk otentikasi - semua route memerlukan login
router.use(suggestionsController.isAuthenticated);

// Route untuk mendapatkan semua saran pembelian
router.get('/', suggestionsController.getAllSuggestions.bind(suggestionsController));

// Route untuk menyetujui saran (membeli/mengisi stok)
router.post('/approve', suggestionsController.approveSuggestion.bind(suggestionsController));

// Route untuk admin - mendapatkan semua saran dari semua user
router.get('/admin/all', suggestionsController.isAdmin.bind(suggestionsController), suggestionsController.getAllSuggestionsAdmin.bind(suggestionsController));

module.exports = router;
