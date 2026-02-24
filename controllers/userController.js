/**
 * User Controller
 * Handle HTTP requests for user management
 * Uses userService for business logic
 */

const userService = require('../services/userService');
const errorHandler = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs').promises;

const userController = {
    // ============================================
    // GET ALL USERS (WITH PAGINATION & FILTERS)
    // ============================================
    getAllUsers: errorHandler.asyncHandler(async (req, res) => {
        const { page, limit, search, status, role, sortBy, sortOrder } = req.query;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 20));

        // Get users
        const result = await userService.getUsers({
            page: pageNum,
            limit: limitNum,
            search,
            status,
            role,
            sortBy,
            sortOrder
        });

        res.json({
            success: true,
            message: 'Users retrieved successfully',
            ...result
        });
    }),

    // ============================================
    // GET USER BY ID
    // ============================================
    getUserById: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        const user = await userService.getUserById(id);

        if (!user) {
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        res.json({
            success: true,
            message: 'User retrieved successfully',
            data: user
        });
    }),

    // ============================================
    // CREATE USER
    // ============================================
    createUser: errorHandler.asyncHandler(async (req, res) => {
        const { name, email, password, role, account_status } = req.body;

        // Validation
        const errors = [];

        if (!name || name.trim().length < 3) {
            errors.push('Nama minimal 3 karakter');
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Email tidak valid');
        }

        if (!password || password.length < 6) {
            errors.push('Password minimal 6 karakter');
        }

        if (role && !['admin', 'user'].includes(role)) {
            errors.push('Role harus admin atau user');
        }

        if (errors.length > 0) {
            return errorHandler.validationError(res, errors);
        }

        // Create user
        const result = await userService.createUser({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            role: role || 'user',
            account_status: account_status || 'active'
        });

        res.status(201).json(result);
    }),

    // ============================================
    // UPDATE USER
    // ============================================
    updateUser: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, email, role, account_status } = req.body;

        // Validation
        const errors = [];

        if (name && name.trim().length < 3) {
            errors.push('Nama minimal 3 karakter');
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Email tidak valid');
        }

        if (role && !['admin', 'user'].includes(role)) {
            errors.push('Role harus admin atau user');
        }

        if (account_status && !['active', 'inactive', 'suspended'].includes(account_status)) {
            errors.push('Status tidak valid');
        }

        if (errors.length > 0) {
            return errorHandler.validationError(res, errors);
        }

        // Update user
        const result = await userService.updateUser(id, {
            name: name ? name.trim() : undefined,
            email: email ? email.toLowerCase().trim() : undefined,
            role,
            account_status
        });

        res.json(result);
    }),

    // ============================================
    // UPDATE USER PASSWORD
    // ============================================
    updatePassword: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { password } = req.body;

        // Validation
        if (!password || password.length < 6) {
            return errorHandler.validationError(res, ['Password minimal 6 karakter']);
        }

        // Update password
        const result = await userService.updatePassword(id, password);

        res.json(result);
    }),

    // ============================================
    // UPLOAD PROFILE IMAGE
    // ============================================
    uploadProfileImage: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Check if file exists
        if (!req.file) {
            return errorHandler.validationError(res, ['File gambar wajib diupload']);
        }

        // Create image path relative to public folder
        const imagePath = `/uploads/${req.file.filename}`;

        // Update database
        const result = await userService.updateProfileImage(id, imagePath);

        res.json(result);
    }),

    // ============================================
    // GET USER'S DATA (PRODUCTS, SUGGESTIONS, NOTES)
    // ============================================
    getUserData: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Check if user exists
        const user = await userService.findById(id);
        if (!user) {
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        // Get all user data
        const [products, suggestions, notes] = await Promise.all([
            userService.getUserProducts(id),
            userService.getUserSuggestions(id),
            userService.getUserNotes(id)
        ]);

        res.json({
            success: true,
            message: 'User data retrieved successfully',
            data: {
                user,
                products,
                suggestions,
                notes
            }
        });
    }),

    // ============================================
    // GET USER'S LOGIN HISTORY
    // ============================================
    getUserLoginHistory: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit = 10 } = req.query;

        // Check if user exists
        const user = await userService.findById(id);
        if (!user) {
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        // Get login history
        const loginHistory = await userService.getUserLoginHistory(id, parseInt(limit));

        res.json({
            success: true,
            message: 'Login history retrieved successfully',
            data: loginHistory
        });
    }),

    // ============================================
    // TOGGLE USER STATUS (ACTIVE/INACTIVE)
    // ============================================
    toggleUserStatus: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Get current user status
        const user = await userService.findById(id);
        if (!user) {
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        // Toggle status
        const newStatus = user.account_status === 'active' ? 'inactive' : 'active';

        const result = await userService.updateUser(id, {
            account_status: newStatus
        });

        res.json({
            success: true,
            message: `User berhasil di${newStatus === 'active' ? 'aktifkan' : 'nonaktifkan'}`,
            data: result.data
        });
    }),

    // ============================================
    // DELETE USER (SOFT DELETE)
    // ============================================
    deleteUser: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        console.log('[userController.deleteUser] Deleting user:', id);
        console.log('[userController.deleteUser] Session user:', req.session?.user);

        // Check if user exists
        const user = await userService.findById(id);
        if (!user) {
            console.log('[userController.deleteUser] User not found');
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        // Prevent deleting yourself
        if (req.session.user && req.session.user.id == id) {
            console.log('[userController.deleteUser] Cannot delete self');
            return errorHandler.forbidden(res, 'Tidak dapat menghapus akun sendiri');
        }

        console.log('[userController.deleteUser] Proceeding with soft delete');
        
        // Soft delete
        const result = await userService.softDelete(id);
        
        console.log('[userController.deleteUser] Delete result:', result);

        res.json(result);
    }),

    // ============================================
    // HARD DELETE USER (PERMANENT)
    // ============================================
    hardDeleteUser: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Check if user exists
        const user = await userService.findById(id);
        if (!user) {
            return errorHandler.notFoundError(res, 'User tidak ditemukan');
        }

        // Prevent deleting yourself
        if (req.session.user && req.session.user.id == id) {
            return errorHandler.forbidden(res, 'Tidak dapat menghapus akun sendiri');
        }

        // Hard delete
        const result = await userService.hardDelete(id);

        res.json(result);
    }),

    // ============================================
    // GET USER STATISTICS
    // ============================================
    getStatistics: errorHandler.asyncHandler(async (req, res) => {
        const stats = await userService.getStatistics();
        const countByStatus = await userService.getCountByStatus();

        res.json({
            success: true,
            message: 'Statistics retrieved successfully',
            data: {
                ...stats,
                byStatus: countByStatus
            }
        });
    })
};

module.exports = userController;
