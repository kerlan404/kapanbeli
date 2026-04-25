const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');

// Admin only middleware
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Akses ditolak. Admin saja.' });
    }
};

router.use(isAdmin);

// API routes
router.post('/broadcast', broadcastController.sendAnnouncement);
router.get('/broadcast/history', broadcastController.getHistory);

module.exports = router;
