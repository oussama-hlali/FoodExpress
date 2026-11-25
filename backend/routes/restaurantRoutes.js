const express = require('express');
const {
  getRestaurants,
  getRestaurantById,
  getMyRestaurants,
  createRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
  deleteRestaurant,
} = require('../controllers/restaurantController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Liste et détails : publics, mais on charge l'utilisateur s'il est connecté
// (permet à l'admin de voir tous les restaurants et au propriétaire de voir le sien).
router.get('/', (req, res, next) => {
  if (req.headers.authorization) return protect(req, res, next);
  next();
}, getRestaurants);

// /mine et les mutations : restaurateur ou admin, avec contrôle de propriété dans le contrôleur.
router.get('/mine', protect, authorize('restaurateur', 'admin'), getMyRestaurants);
router.get('/:id', (req, res, next) => {
  if (req.headers.authorization) return protect(req, res, next);
  next();
}, getRestaurantById);

router.post('/', protect, authorize('restaurateur', 'admin'), createRestaurant);
// Validation / suspension d'un restaurant : admin uniquement.
router.put('/:id/status', protect, authorize('admin'), updateRestaurantStatus);
router.put('/:id', protect, authorize('restaurateur', 'admin'), updateRestaurant);
router.delete('/:id', protect, authorize('restaurateur', 'admin'), deleteRestaurant);

module.exports = router;
