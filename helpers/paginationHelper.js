/**
 * Pagination Helper
 * Reusable helper for safe pagination and query parameter handling
 * Production-ready dengan default values dan validasi
 */

/**
 * Get safe pagination parameters
 * @param {Object} params - Query parameters
 * @returns {Object} Safe pagination object with defaults
 */
function getPaginationParams(params = {}) {
    const safeParams = params || {};
    
    return {
        page: Math.max(1, Number(safeParams.page) || 1),
        limit: Math.max(1, Math.min(100, Number(safeParams.limit) || 20)),
        offset: 0, // Will be calculated
        sortBy: safeParams.sortBy || 'created_at',
        sortOrder: safeParams.sortOrder || 'DESC',
        search: safeParams.search || '',
        filters: safeParams.filters || {}
    };
}

/**
 * Calculate offset from page and limit
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {number} Offset value
 */
function calculateOffset(page, limit) {
    return (page - 1) * limit;
}

/**
 * Build pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
function buildPagination(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        offset: calculateOffset(page, limit)
    };
}

/**
 * Validate sort column against allowed columns
 * @param {string} column - Column to validate
 * @param {string[]} allowedColumns - List of allowed columns
 * @param {string} defaultColumn - Default column if invalid
 * @returns {string} Validated column name
 */
function validateSortColumn(column, allowedColumns, defaultColumn = 'created_at') {
    if (!column || !allowedColumns.includes(column)) {
        return defaultColumn;
    }
    return column;
}

/**
 * Validate sort order
 * @param {string} order - Sort order
 * @returns {string} Validated order (ASC or DESC)
 */
function validateSortOrder(order) {
    const validOrders = ['ASC', 'DESC'];
    const upperOrder = (order || 'DESC').toUpperCase();
    return validOrders.includes(upperOrder) ? upperOrder : 'DESC';
}

/**
 * Safe string filter - prevents SQL injection
 * @param {string} value - Value to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }
    // Remove potential SQL injection characters
    return value.replace(/['";\\]/g, '').trim();
}

/**
 * Build WHERE clause safely
 * @param {Object} filters - Filter conditions
 * @param {Array} params - Parameters array (will be mutated)
 * @returns {string} WHERE clause
 */
function buildWhereClause(filters = {}, params = []) {
    const clauses = [];
    
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') {
            continue;
        }
        
        if (typeof value === 'string') {
            clauses.push(`${key} LIKE ?`);
            params.push(`%${sanitizeString(value)}%`);
        } else if (Array.isArray(value)) {
            clauses.push(`${key} IN (${value.map(() => '?').join(',')})`);
            params.push(...value);
        } else {
            clauses.push(`${key} = ?`);
            params.push(value);
        }
    }
    
    return clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
}

module.exports = {
    getPaginationParams,
    calculateOffset,
    buildPagination,
    validateSortColumn,
    validateSortOrder,
    sanitizeString,
    buildWhereClause
};
