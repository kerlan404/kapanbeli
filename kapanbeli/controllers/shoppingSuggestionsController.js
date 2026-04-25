/**
 * Shopping Suggestions Controller
 * Controller untuk halaman saran pembelian
 */

const shoppingSuggestionsService = require('../services/shoppingSuggestionsService');
const errorHandler = require('../middleware/errorHandler');

const shoppingSuggestionsController = {
    /**
     * GET /admin/shopping-suggestions
     * Show shopping suggestions page
     */
    showPage: errorHandler.asyncHandler(async (req, res) => {
        res.render('admin-shopping-suggestions', {
            currentPage: 'shopping-suggestions',
            pageTitle: 'Saran Pembelian'
        });
    }),

    /**
     * GET /api/admin/shopping-suggestions
     * API endpoint untuk mendapatkan saran pembelian
     */
    getSuggestions: errorHandler.asyncHandler(async (req, res) => {
        const { page, limit, search, status } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

        const result = await shoppingSuggestionsService.getSuggestions({
            page: pageNum,
            limit: limitNum,
            search,
            status
        });

        res.json({
            success: true,
            message: 'Shopping suggestions retrieved successfully',
            ...result
        });
    }),

    /**
     * GET /api/admin/shopping-suggestions/statistics
     * API endpoint untuk mendapatkan statistik
     */
    getStatistics: errorHandler.asyncHandler(async (req, res) => {
        const stats = await shoppingSuggestionsService.getStatistics();

        res.json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: stats
        });
    })
};

module.exports = shoppingSuggestionsController;
