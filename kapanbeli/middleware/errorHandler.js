/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const errorHandler = {
    /**
     * Handle async errors with try-catch wrapper
     * @param {Function} fn - Async function to wrap
     * @returns {Function} Express middleware function
     */
    asyncHandler: (fn) => (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    },

    /**
     * Not Found Handler (404)
     */
    notFound: (req, res, next) => {
        const error = new Error(`Not Found - ${req.originalUrl}`);
        res.status(404);
        next(error);
    },

    /**
     * Global Error Handler
     * Should be placed last in middleware chain
     */
    global: (err, req, res, next) => {
        // Set status code
        const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
        res.status(statusCode);

        // Log error for debugging (in production, use proper logging service)
        console.error('Error:', {
            message: err.message,
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
            url: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Send error response
        res.json({
            success: false,
            message: err.message || 'Internal Server Error',
            stack: process.env.NODE_ENV === 'production' ? null : err.stack,
            url: req.originalUrl,
            method: req.method
        });
    },

    /**
     * Validation Error Handler
     */
    validationError: (res, errors) => {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: errors
        });
    },

    /**
     * Authorization Error Handler
     */
    unauthorized: (res, message = 'Unauthorized') => {
        return res.status(401).json({
            success: false,
            message: message
        });
    },

    /**
     * Forbidden Error Handler
     */
    forbidden: (res, message = 'Forbidden') => {
        return res.status(403).json({
            success: false,
            message: message
        });
    },

    /**
     * Not Found Error Handler
     */
    notFoundError: (res, message = 'Resource not found') => {
        return res.status(404).json({
            success: false,
            message: message
        });
    },

    /**
     * Conflict Error Handler
     */
    conflict: (res, message = 'Resource already exists') => {
        return res.status(409).json({
            success: false,
            message: message
        });
    }
};

module.exports = errorHandler;
