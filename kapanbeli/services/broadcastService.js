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
                // Send to ALL users (including admins)
                [users] = await db.execute('SELECT id FROM users');
            } else if (sendTo === 'active') {
                // Send to all active users (including admins)
                [users] = await db.execute('SELECT id FROM users WHERE account_status = "active"');
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
                    COUNT(user_id) as sent_to,
                    MAX(created_at) as created_at
                FROM notifications
                GROUP BY title, message, type
                ORDER BY created_at DESC
                LIMIT 20
            `);

            const [totalCount] = await db.execute('SELECT COUNT(*) as total_sent FROM (SELECT 1 FROM notifications GROUP BY title, message, type) as broadcasts');

            return { 
                success: true, 
                data: history,
                total_sent: totalCount[0].total_sent
            };
        } catch (error) {
            console.error('[broadcastService.getAnnouncementHistory] Error:', error);
            throw error;
        }
    }
};

module.exports = broadcastService;
