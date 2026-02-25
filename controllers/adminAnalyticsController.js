/**
 * Admin Analytics Controller
 * Sistem Analitik Pertumbuhan untuk Kapan Beli Admin Panel
 * 
 * Features:
 * - New Users Analytics (Today, 7 Days, Month)
 * - Daily Login Analytics
 * - Growth Percentage Calculation
 * - Daily Active Users (DAU)
 * - Timezone: Asia/Jakarta (WIB)
 */

const db = require('../config/database');

const analyticsController = {
    /**
     * GET /api/admin/analytics
     */
    async getAnalytics(req, res) {
        try {
            // Validate admin
            if (!req.session?.user?.role || req.session.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Akses ditolak. Admin saja.'
                });
            }

            const range = req.query.range || '7days';
            await db.execute("SET time_zone = '+07:00'");

            const config = {
                today: { days: 1, interval: 0, hourFormat: true },
                '7days': { days: 7, interval: 6, hourFormat: false },
                month: { days: 30, interval: 29, hourFormat: false }
            };

            const { days, interval, hourFormat } = config[range] || config['7days'];
            const dateFormat = hourFormat ? '%H:00' : '%Y-%m-%d';

            // Execute queries in parallel
            const [
                usersResult,
                loginsResult,
                totalUsersResult,
                totalLoginsResult,
                dauResult,
                prevUsersResult,
                prevLoginsResult
            ] = await Promise.all([
                // Current period users
                db.execute(`
                    SELECT DATE_FORMAT(created_at, ?) as period, COUNT(*) as count
                    FROM users
                    WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    GROUP BY DATE_FORMAT(created_at, ?)
                    ORDER BY period ASC
                `, [dateFormat, interval, dateFormat]),

                // Current period logins - use login_time for consistency
                db.execute(`
                    SELECT DATE_FORMAT(login_time, ?) as period, COUNT(*) as count
                    FROM login_logs
                    WHERE DATE(login_time) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                    GROUP BY DATE_FORMAT(login_time, ?)
                    ORDER BY period ASC
                `, [dateFormat, interval, dateFormat]),

                // Total users
                db.execute('SELECT COUNT(*) as count FROM users'),

                // Total logins current period - use login_time
                db.execute(`
                    SELECT COUNT(*) as count FROM login_logs
                    WHERE DATE(login_time) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                `, [interval]),

                // DAU current period - use login_time
                db.execute(`
                    SELECT COUNT(DISTINCT user_id) as count FROM login_logs
                    WHERE DATE(login_time) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
                `, [interval]),

                // Previous period users
                db.execute(`
                    SELECT COUNT(*) as count FROM users
                    WHERE DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE_SUB(CURDATE(), INTERVAL ? DAY)
                `, [interval + days, interval + 1]),

                // Previous period logins - use login_time
                db.execute(`
                    SELECT COUNT(*) as count FROM login_logs
                    WHERE DATE(login_time) BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY) AND DATE_SUB(CURDATE(), INTERVAL ? DAY)
                `, [interval + days, interval + 1])
            ]);

            // Generate labels
            const labels = this.generateLabels(range, days);

            // Map data with zero-filling
            const usersMap = new Map(usersResult[0].map(r => [r.period, parseInt(r.count)]));
            const loginsMap = new Map(loginsResult[0].map(r => [r.period, parseInt(r.count)]));

            const usersData = labels.map(label => {
                const key = this.getLabelKey(label, range, days);
                return usersMap.get(key) || 0;
            });

            const loginsData = labels.map(label => {
                const key = this.getLabelKey(label, range, days);
                return loginsMap.get(key) || 0;
            });

            // Calculate growth
            const currUsers = usersResult[0].reduce((sum, r) => sum + parseInt(r.count), 0);
            const prevUsers = prevUsersResult[0][0].count;
            const currLogins = totalLoginsResult[0][0].count;
            const prevLogins = prevLoginsResult[0][0].count;

            const response = {
                success: true,
                range: range,
                period: this.getPeriodLabel(range),
                timestamp: new Date().toISOString(),
                timezone: 'Asia/Jakarta',
                summary: {
                    totalUsers: totalUsersResult[0][0].count,
                    totalLogins: currLogins,
                    dailyActiveUsers: dauResult[0][0].count,
                    newUsers: currUsers,
                    growth: {
                        users: {
                            current: currUsers,
                            previous: prevUsers,
                            percentage: this.calcGrowth(prevUsers, currUsers),
                            trend: currUsers >= prevUsers ? 'up' : 'down'
                        },
                        logins: {
                            current: currLogins,
                            previous: prevLogins,
                            percentage: this.calcGrowth(prevLogins, currLogins),
                            trend: currLogins >= prevLogins ? 'up' : 'down'
                        }
                    }
                },
                chart: {
                    labels: labels,
                    users: usersData,
                    logins: loginsData
                }
            };

            res.json(response);

        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * GET /api/admin/analytics/summary
     */
    async getSummary(req, res) {
        try {
            if (!req.session?.user?.role || req.session.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Akses ditolak.' });
            }

            await db.execute("SET time_zone = '+07:00'");

            const [totalUsers, todayUsers, todayLogins, dau, onlineUsers] = await Promise.all([
                db.execute('SELECT COUNT(*) as count FROM users'),
                db.execute('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'),
                db.execute('SELECT COUNT(*) as count FROM login_logs WHERE DATE(login_time) = CURDATE()'),
                db.execute('SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE DATE(login_time) = CURDATE()'),
                db.execute('SELECT COUNT(DISTINCT user_id) as count FROM login_logs WHERE login_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)')
            ]);

            res.json({
                success: true,
                data: {
                    totalUsers: totalUsers[0][0].count,
                    newUsersToday: todayUsers[0][0].count,
                    loginsToday: todayLogins[0][0].count,
                    dailyActiveUsers: dau[0][0].count,
                    onlineUsers: onlineUsers[0][0].count
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Summary error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    },

    // Helper functions
    generateLabels(range, days) {
        const labels = [];
        if (range === 'today') {
            for (let i = 0; i < 24; i++) {
                labels.push(i.toString().padStart(2, '0') + ':00');
            }
        } else {
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
            }
        }
        return labels;
    },

    getLabelKey(label, range, days) {
        if (range === 'today') {
            return label;
        }
        // Convert label back to date
        const parts = label.split(' ');
        const months = { 'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'Mei': 4, 'Jun': 5, 'Jul': 6, 'Agu': 7, 'Sep': 8, 'Okt': 9, 'Nov': 10, 'Des': 11 };
        const year = new Date().getFullYear();
        const month = months[parts[1]];
        const day = parseInt(parts[0]);
        const d = new Date(year, month, day);
        return d.toISOString().split('T')[0];
    },

    getPeriodLabel(range) {
        const labels = { today: 'Hari Ini', '7days': '7 Hari Terakhir', month: 'Bulan Ini' };
        return labels[range] || '7 Hari Terakhir';
    },

    calcGrowth(prev, curr) {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return parseFloat((((curr - prev) / prev) * 100).toFixed(2));
    }
};

module.exports = analyticsController;
