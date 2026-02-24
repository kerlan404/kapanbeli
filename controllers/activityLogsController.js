/**
 * Activity Logs Controller
 * Handler untuk API endpoints activity logs
 */

const activityLogsService = require('../services/activityLogsService');

const activityLogsController = {
    /**
     * GET /api/activity-logs
     * Get activity logs dengan pagination dan filter
     * Query params: range, search, page, limit, activityType
     */
    async getLogs(req, res) {
        try {
            const {
                range = '7days',
                search = '',
                page = 1,
                limit = 10,
                activityType = ''
            } = req.query;

            // Validate range
            const validRanges = ['today', '7days', 'month'];
            if (!validRanges.includes(range)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range. Use: today, 7days, or month',
                    data: [],
                    pagination: null
                });
            }

            // Validate page and limit
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));

            // Get logs from service
            const result = await activityLogsService.getLogs({
                range,
                search,
                page: pageNum,
                limit: limitNum,
                activityType
            });

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Activity logs retrieved successfully',
                    data: result.data,
                    pagination: result.pagination,
                    filters: {
                        range,
                        search,
                        activityType
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.error || 'Failed to get activity logs',
                    data: [],
                    pagination: null
                });
            }
        } catch (error) {
            console.error('Error in getLogs controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message,
                data: [],
                pagination: null
            });
        }
    },

    /**
     * GET /api/activity-logs/statistics
     * Get activity statistics
     */
    async getStatistics(req, res) {
        try {
            const { range = '7days' } = req.query;

            const validRanges = ['today', '7days', 'month'];
            if (!validRanges.includes(range)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid range. Use: today, 7days, or month'
                });
            }

            const result = await activityLogsService.getStatistics(range);

            if (result.success) {
                res.json({
                    success: true,
                    ...result
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.error || 'Failed to get statistics'
                });
            }
        } catch (error) {
            console.error('Error in getStatistics controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },

    /**
     * POST /api/activity-logs
     * Create new activity log (internal use)
     */
    async createLog(req, res) {
        try {
            const { userId, activityType, description, ip, userAgent } = req.body;

            // Validate required fields
            if (!userId || !activityType || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'userId, activityType, and description are required'
                });
            }

            // Get IP from request if not provided
            const ipAddress = ip || req.ip || req.connection.remoteAddress;
            const useragent = userAgent || req.get('user-agent') || null;

            const result = await activityLogsService.log(
                userId,
                activityType,
                description,
                ipAddress,
                useragent
            );

            if (result.success) {
                res.status(201).json({
                    success: true,
                    message: 'Activity logged successfully',
                    data: {
                        id: result.id,
                        timestamp: result.timestamp
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.error || 'Failed to log activity'
                });
            }
        } catch (error) {
            console.error('Error in createLog controller:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
};

module.exports = activityLogsController;
