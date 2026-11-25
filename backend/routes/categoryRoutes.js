const express = require('express');
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Lecture publique du catalogue ; écritures restaurateur / admin.
router.get('/', getCategories);
router.post('/', protect, authorize('restaurateur', 'admin'), createCategory);
router.put('/:id', protect, authorize('restaurateur', 'admin'), updateCategory);
router.delete('/:id', protect, authorize('restaurateur', 'admin'), deleteCategory);

module.exports = router;
