/**
 * Admin Category Management Controller
 */

const categoryService = require('../services/categoryService');
const errorHandler = require('../middleware/errorHandler');

const categoryController = {
    /**
     * GET /admin/categories
     */
    showPage: errorHandler.asyncHandler(async (req, res) => {
        res.render('admin-categories', {
            currentPage: 'categories',
            pageTitle: 'Manajemen Kategori'
        });
    }),

    /**
     * GET /api/admin/categories
     */
    getAll: errorHandler.asyncHandler(async (req, res) => {
        const categories = await categoryService.getAllCategories();
        res.json(categories);
    }),

    /**
     * POST /api/admin/categories
     */
    create: errorHandler.asyncHandler(async (req, res) => {
        const { name, description } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Nama kategori minimal 2 karakter' });
        }

        const result = await categoryService.createCategory(name.trim(), description || '');
        res.status(201).json(result);
    }),

    /**
     * PUT /api/admin/categories/:id
     */
    update: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || name.trim().length < 2) {
            return res.status(400).json({ success: false, message: 'Nama kategori minimal 2 karakter' });
        }

        const result = await categoryService.updateCategory(id, name.trim(), description || '');
        res.json(result);
    }),

    /**
     * DELETE /api/admin/categories/:id
     */
    delete: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const result = await categoryService.deleteCategory(id);
        res.json(result);
    })
};

module.exports = categoryController;
