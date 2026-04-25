/**
 * Admin Expired Items Controller
 */

const expiredService = require('../services/expiredService');
const errorHandler = require('../middleware/errorHandler');

const expiredController = {
    /**
     * GET /admin/expired-watch
     */
    showPage: errorHandler.asyncHandler(async (req, res) => {
        res.render('admin-expired-watch', {
            currentPage: 'expired-watch',
            pageTitle: 'Monitoring Kadaluarsa'
        });
    }),

    /**
     * GET /api/admin/expired-items
     */
    getExpiredItems: errorHandler.asyncHandler(async (req, res) => {
        const { page, limit, search, category } = req.query;
        const result = await expiredService.getExpiredItems({
            page: page || 1,
            limit: limit || 20,
            search: search || '',
            category: category || ''
        });
        res.json(result);
    }),

    /**
     * GET /api/admin/wastage-stats
     */
    getWastageStats: errorHandler.asyncHandler(async (req, res) => {
        const stats = await expiredService.getWastageStats();
        res.json(stats);
    }),

    /**
     * GET /api/admin/expiring-soon
     */
    getExpiringSoon: errorHandler.asyncHandler(async (req, res) => {
        const items = await expiredService.getExpiringSoon();
        res.json(items);
    })
};

module.exports = expiredController;
