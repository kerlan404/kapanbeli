/**
 * Admin Broadcast Service
 * Kirim notifikasi massal ke semua user
 */

const db = require('../config/database');

const broadcastService = {
    /**
     * Send announcement to all users
     */
    async sendAnnouncement(title, message, type = 'info', sendTo = 'all') {
        try {
            // Database only supports: info, warning, error
            const validTypes = ['info', 'warning', 'error'];
            if (!validTypes.includes(type)) {
                type = 'info';
            }

            // Get target users
            let users;
            if (sendTo === 'all') {
                [users] = await db.execute('SELECT id FROM users WHERE role = "user"');
            } else if (sendTo === 'active') {
                [users] = await db.execute('SELECT id FROM users WHERE role = "user" AND account_status = "active"');
            } else {
                throw new Error('Invalid target audience');
            }

            if (users.length === 0) {
                return { success: true, sent_count: 0, message: 'Tidak ada user target' };
            }

            // Insert notifications in batches for better performance
            const batchSize = 100;
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                const placeholders = batch.map(() => '(?, ?, ?, ?, FALSE, NOW())').join(', ');
                const values = batch.flatMap(u => [u.id, title, message, type]);
                
                await db.execute(
                    `INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES ${placeholders}`,
                    values
                );
            }

            return {
                success: true,
                sent_count: users.length,
                message: `Pengumuman terkirim ke ${users.length} user`
            };
        } catch (error) {
            console.error('[broadcastService.sendAnnouncement] Error:', error);
            throw error;
        }
    },

    /**
     * Get announcement history
     */
    async getAnnouncementHistory() {
        try {
            const [history] = await db.execute(`
                SELECT
                    title,
                    message,
                    type,
                    created_at,
                    COUNT(DISTINCT user_id) as sent_to
                FROM notifications
                WHERE title IN (
                    SELECT DISTINCT title FROM notifications
                    ORDER BY created_at DESC
                    LIMIT 50
                )
                GROUP BY title, message, type, created_at
                ORDER BY created_at DESC
                LIMIT 20
            `);

            return { success: true, data: history };
        } catch (error) {
            console.error('[broadcastService.getAnnouncementHistory] Error:', error);
            throw error;
        }
    }
};

module.exports = broadcastService;
