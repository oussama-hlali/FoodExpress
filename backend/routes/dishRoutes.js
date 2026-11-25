const express = require('express');
const {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  toggleAvailability,
  deleteDish,
} = require('../controllers/dishController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Consultation publique du menu ; modifications réservées au propriétaire du restaurant.
router.get('/', getDishes);
router.get('/:id', getDishById);

router.post('/', protect, authorize('restaurateur', 'admin'), createDish);
router.put('/:id/availability', protect, authorize('restaurateur', 'admin'), toggleAvailability);
router.put('/:id', protect, authorize('restaurateur', 'admin'), updateDish);
router.delete('/:id', protect, authorize('restaurateur', 'admin'), deleteDish);

module.exports = router;
