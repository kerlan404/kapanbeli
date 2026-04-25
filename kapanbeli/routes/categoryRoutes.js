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

// API routes only (page routes are handled in server.js)
router.get('/categories', categoryController.getAll);
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

module.exports = router;
