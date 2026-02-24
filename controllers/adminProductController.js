/**
 * Admin Product Controller
 * Handler untuk halaman manajemen produk di admin panel
 * Production-ready dengan error handling yang baik
 */

const adminProductService = require('../services/adminProductService');
const errorHandler = require('../middleware/errorHandler');

const adminProductController = {
    /**
     * GET /admin/products
     * Tampilkan halaman manajemen produk
     */
    showProductsPage: errorHandler.asyncHandler(async (req, res) => {
        res.render('admin-products', {
            currentPage: 'products',
            pageTitle: 'Manajemen Produk'
        });
    }),

    /**
     * GET /api/admin/products
     * API endpoint untuk mendapatkan daftar produk
     */
    getProducts: errorHandler.asyncHandler(async (req, res) => {
        const { page, limit, search, category, stockStatus, sortBy, sortOrder } = req.query;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

        // Get products
        const result = await adminProductService.getProducts({
            page: pageNum,
            limit: limitNum,
            search,
            category,
            stockStatus,
            sortBy,
            sortOrder
        });

        res.json({
            success: true,
            message: 'Products retrieved successfully',
            ...result
        });
    }),

    /**
     * GET /api/admin/products/statistics
     * API endpoint untuk mendapatkan statistik produk
     */
    getStatistics: errorHandler.asyncHandler(async (req, res) => {
        const stats = await adminProductService.getStatistics();
        const categories = await adminProductService.getCategories();

        res.json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                ...stats,
                categories
            }
        });
    }),

    /**
     * GET /api/admin/products/:id
     * API endpoint untuk mendapatkan detail produk
     */
    getProduct: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        const product = await adminProductService.getProductById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produk tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'Product retrieved successfully',
            data: product
        });
    }),

    /**
     * PUT /api/admin/products/:id
     * API endpoint untuk update produk
     */
    updateProduct: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;

        // Validate input
        const errors = [];

        if (updateData.name && updateData.name.trim().length < 3) {
            errors.push('Nama produk minimal 3 karakter');
        }

        if (updateData.stock_quantity !== undefined && updateData.stock_quantity < 0) {
            errors.push('Stok tidak boleh negatif');
        }

        if (updateData.min_stock_level !== undefined && updateData.min_stock_level < 0) {
            errors.push('Minimum stok tidak boleh negatif');
        }

        if (errors.length > 0) {
            return errorHandler.validationError(res, errors);
        }

        // Update product
        const result = await adminProductService.updateProduct(id, updateData);

        res.json(result);
    }),

    /**
     * DELETE /api/admin/products/:id
     * API endpoint untuk hapus produk
     */
    deleteProduct: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Delete product
        const result = await adminProductService.deleteProduct(id);

        res.json(result);
    }),

    /**
     * PATCH /api/admin/products/:id/toggle-status
     * API endpoint untuk toggle status produk
     */
    toggleStatus: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Toggle status
        const result = await adminProductService.toggleStatus(id);

        res.json(result);
    })
};

module.exports = adminProductController;
