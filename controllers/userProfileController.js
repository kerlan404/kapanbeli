/**
 * User Profile Controller
 * Handler untuk halaman detail profil user
 * Production-ready dengan error handling yang baik
 */

const userProfileService = require('../services/userProfileService');
const errorHandler = require('../middleware/errorHandler');

const userProfileController = {
    /**
     * GET /admin/user/:id
     * Tampilkan halaman detail profil user
     */
    showUserProfile: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Validate user ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).render('error', {
                message: 'ID user tidak valid',
                errorCode: 400
            });
        }

        const userId = parseInt(id);

        // Get complete user profile
        const profileData = await userProfileService.getCompleteUserProfile(userId);

        if (!profileData) {
            return res.status(404).render('error', {
                message: 'User tidak ditemukan',
                errorCode: 404
            });
        }

        // Render profile page
        res.render('admin-user-profile', {
            currentPage: 'users',
            user: profileData.user,
            activityLogs: profileData.activityLogs,
            products: profileData.products,
            suggestions: profileData.suggestions,
            notes: profileData.notes,
            summary: profileData.summary,
            pageTitle: `Profil ${profileData.user.name}`
        });
    }),

    /**
     * GET /api/admin/user/:id/profile-data
     * API endpoint untuk mendapatkan data profil user (JSON)
     */
    getUserProfileData: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;

        // Validate user ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'ID user tidak valid'
            });
        }

        const userId = parseInt(id);

        // Get complete user profile
        const profileData = await userProfileService.getCompleteUserProfile(userId);

        if (!profileData) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            message: 'User profile data retrieved successfully',
            data: profileData
        });
    }),

    /**
     * GET /api/admin/user/:id/activity
     * API endpoint untuk mendapatkan activity logs user
     */
    getUserActivity: errorHandler.asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { limit = 10, page = 1 } = req.query;

        // Validate user ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({
                success: false,
                message: 'ID user tidak valid'
            });
        }

        const userId = parseInt(id);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const pageNum = Math.max(1, parseInt(page));
        const offset = (pageNum - 1) * limitNum;

        // Check if user exists
        const userStats = await userProfileService.getUserStatistics(userId);
        if (!userStats) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Get activity logs with pagination
        const query = `
            SELECT 
                al.id,
                al.activity_type,
                al.description,
                al.ip_address,
                al.created_at
            FROM activity_logs al
            WHERE al.user_id = ?
            ORDER BY al.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM activity_logs
            WHERE user_id = ?
        `;

        const [db] = await Promise.all([
            require('../config/database'),
            userProfileService.getUserStatistics(userId)
        ]);

        const [activityRows] = await db.execute(query, [userId, limitNum, offset]);
        const [countRows] = await db.execute(countQuery, [userId]);

        const total = countRows[0].total;
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            message: 'Activity logs retrieved successfully',
            data: activityRows,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1
            }
        });
    })
};

module.exports = userProfileController;
