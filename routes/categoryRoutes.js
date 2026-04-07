const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

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
router.get('/categories', categoryController.showPage);

// API routes
router.get('/api/categories', categoryController.getAll);
router.post('/api/categories', categoryController.create);
router.put('/api/categories/:id', categoryController.update);
router.delete('/api/categories/:id', categoryController.delete);

module.exports = router;
