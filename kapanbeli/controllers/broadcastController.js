/**
 * Admin Broadcast Controller
 */

const broadcastService = require('../services/broadcastService');
const errorHandler = require('../middleware/errorHandler');

const broadcastController = {
    /**
     * POST /api/admin/broadcast
     */
    sendAnnouncement: errorHandler.asyncHandler(async (req, res) => {
        const { title, message, type = 'info', sendTo = 'all' } = req.body;

        if (!title || title.trim().length < 3) {
            return res.status(400).json({ success: false, message: 'Judul minimal 3 karakter' });
        }

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
        }

        const result = await broadcastService.sendAnnouncement(
            title.trim(),
            message.trim(),
            type,
            sendTo
        );

        res.json(result);
    }),

    /**
     * GET /api/admin/broadcast/history
     */
    getHistory: errorHandler.asyncHandler(async (req, res) => {
        const history = await broadcastService.getAnnouncementHistory();
        res.json(history);
    })
};

module.exports = broadcastController;
