const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

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
router.get('/export/users', exportController.exportUsers);
router.get('/export/products', exportController.exportProducts);
router.get('/export/categories', exportController.exportCategories);

module.exports = router;
