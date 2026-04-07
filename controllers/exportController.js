/**
 * Admin Export Controller
 */

const exportService = require('../services/exportService');
const errorHandler = require('../middleware/errorHandler');

const exportController = {
    /**
     * GET /api/admin/export/users
     */
    exportUsers: errorHandler.asyncHandler(async (req, res) => {
        const { filename, content } = await exportService.exportUsers();

        res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    }),

    /**
     * GET /api/admin/export/products
     */
    exportProducts: errorHandler.asyncHandler(async (req, res) => {
        const { filename, content } = await exportService.exportProducts();

        res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    }),

    /**
     * GET /api/admin/export/categories
     */
    exportCategories: errorHandler.asyncHandler(async (req, res) => {
        const { filename, content } = await exportService.exportCategories();

        res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    })
};

module.exports = exportController;
