/**
 * Admin Notes Routes
 * Routes untuk manajemen catatan di admin panel
 * Base path: /api/admin/notes
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { getPaginationParams, buildPagination, sanitizeString, calculateOffset } = require('../helpers/paginationHelper');

// Middleware untuk memeriksa apakah user terautentikasi
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
};

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

// Apply authentication and admin check to all routes
router.use(isAuthenticated);
router.use(isAdmin);

/**
 * @route GET /api/admin/notes
 * @desc API endpoint untuk mendapatkan daftar catatan
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20)
 * @query {string} search - Search by title, content, or user name/email
 * @query {string} type - Filter by note type (recipe, shopping, other)
 * @query {string} userId - Filter by user ID
 * @access Private (Admin)
 */
router.get('/', async (req, res) => {
    try {
        // Use safe pagination helper
        const pagination = getPaginationParams(req.query);
        const { page, limit, search } = pagination;
        const offset = calculateOffset(page, limit);

        const { userId } = req.query;

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (n.title LIKE ? OR n.content LIKE ? OR u.name LIKE ? OR u.email LIKE ?)';
            const searchPattern = `%${sanitizeString(search)}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        if (userId) {
            whereClause += ' AND n.user_id = ?';
            params.push(userId);
        }

        // Get total count
        const [countResult] = await db.execute(`
            SELECT COUNT(*) as total
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE ${whereClause}
        `, params);

        const total = countResult[0].total;

        // Get notes with user info (note: table doesn't have type or is_active columns)
        const [notes] = await db.execute(`
            SELECT
                n.id, n.title, n.content, n.is_completed, n.created_at, n.updated_at,
                n.user_id,
                u.name as user_name, u.email as user_email
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE ${whereClause}
            ORDER BY n.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        res.json({
            success: true,
            data: notes,
            pagination: buildPagination(total, page, limit)
        });
    } catch (error) {
        console.error('[adminNotesRoutes.get] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notes: ' + error.message
        });
    }
});

/**
 * @route GET /api/admin/notes/statistics
 * @desc API endpoint untuk mendapatkan statistik catatan
 * @access Private (Admin)
 */
router.get('/statistics', async (req, res) => {
    try {
        const [totalResult] = await db.execute('SELECT COUNT(*) as total FROM notes');
        const [completedResult] = await db.execute('SELECT COUNT(*) as total FROM notes WHERE is_completed = TRUE');
        const [pendingResult] = await db.execute('SELECT COUNT(*) as total FROM notes WHERE is_completed = FALSE');

        res.json({
            success: true,
            data: {
                total: totalResult[0].total,
                completed: completedResult[0].total,
                pending: pendingResult[0].total,
                // Placeholder for type stats (table doesn't have type column)
                recipe: 0,
                shopping: 0,
                other: totalResult[0].total
            }
        });
    } catch (error) {
        console.error('[adminNotesRoutes.statistics] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics: ' + error.message
        });
    }
});

/**
 * @route GET /api/admin/notes/:id
 * @desc API endpoint untuk mendapatkan detail catatan
 * @access Private (Admin)
 */
router.get('/:id', async (req, res) => {
    try {
        const [notes] = await db.execute(`
            SELECT 
                n.*,
                u.name as user_name, u.email as user_email
            FROM notes n
            LEFT JOIN users u ON n.user_id = u.id
            WHERE n.id = ?
        `, [req.params.id]);

        if (notes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Catatan tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: notes[0]
        });
    } catch (error) {
        console.error('Error getting note detail:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route PUT /api/admin/notes/:id
 * @desc API endpoint untuk update catatan
 * @access Private (Admin)
 */
router.put('/:id', async (req, res) => {
    try {
        const { title, content, is_completed } = req.body;

        await db.execute(`
            UPDATE notes
            SET title = ?, content = ?, is_completed = ?, updated_at = NOW()
            WHERE id = ?
        `, [title, content, is_completed, req.params.id]);

        res.json({
            success: true,
            message: 'Catatan berhasil diupdate'
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route DELETE /api/admin/notes/:id
 * @desc API endpoint untuk hapus catatan
 * @access Private (Admin)
 */
router.delete('/:id', async (req, res) => {
    try {
        await db.execute('DELETE FROM notes WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'Catatan berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
