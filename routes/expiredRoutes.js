const express = require('express');
const router = express.Router();
const expiredController = require('../controllers/expiredController');

// Admin only middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Akses ditolak. Admin saja.' });
    }
};

router.use(isAdmin);

// Page route
router.get('/expired-watch', expiredController.showPage);

// API routes
router.get('/api/expired-items', expiredController.getExpiredItems);
router.get('/api/wastage-stats', expiredController.getWastageStats);
router.get('/api/expiring-soon', expiredController.getExpiringSoon);

module.exports = router;
