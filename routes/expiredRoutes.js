const express = require('express');
const router = express.Router();
const expiredController = require('../controllers/expiredController');

// Admin only middleware for API routes
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Akses ditolak. Admin saja.' });
    }
};

router.use(isAdmin);

// API routes only (page routes are handled in server.js)
router.get('/expired-items', expiredController.getExpiredItems);
router.get('/wastage-stats', expiredController.getWastageStats);
router.get('/expiring-soon', expiredController.getExpiringSoon);

module.exports = router;
