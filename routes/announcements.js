const express = require('express');
const router = express.Router();
const errorHandler = require('../middleware/errorHandler');
const db = require('../config/database');

// Auth check
const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.status(401).json({ success: false, message: 'Silakan login.' });
};

// GET /api/announcements - Get user's announcements
router.get('/', isAuthenticated, errorHandler.asyncHandler(async (req, res) => {
    const userId = req.session.user.id;
    const { unread = 'false' } = req.query;
    
    const whereClause = unread === 'true' ? 'WHERE is_read = 0' : '';
    
    const [announcements] = await db.execute(`
        SELECT 
            id, title, message, type, is_read, created_at,
            CASE
                WHEN type = 'error' THEN 'Penting'
                WHEN type = 'warning' THEN 'Peringatan'
                WHEN type = 'success' THEN 'Info'
                ELSE 'Info'
            END as type_label
        FROM notifications
        WHERE user_id = ? AND title IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 50
    `, [userId]);
    
    // Get unread count
    const [unreadResult] = await db.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
    );
    
    res.json({
        success: true,
        data: announcements,
        unreadCount: unreadResult[0].count
    });
}));

// PUT /api/announcements/:id/read - Mark as read
router.put('/:id/read', isAuthenticated, errorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    await db.execute(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [id, userId]
    );
    
    res.json({ success: true, message: 'Tandai dibaca' });
}));

// PUT /api/announcements/read-all - Mark all as read
router.put('/read-all', isAuthenticated, errorHandler.asyncHandler(async (req, res) => {
    const userId = req.session.user.id;
    
    const [result] = await db.execute(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
    );
    
    res.json({ success: true, message: `${result.affectedRows} pesan ditandai dibaca` });
}));

// DELETE /api/announcements/:id - Delete announcement
router.delete('/:id', isAuthenticated, errorHandler.asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    await db.execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
    
    res.json({ success: true, message: 'Pesan dihapus' });
}));

module.exports = router;
