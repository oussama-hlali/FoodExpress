const express = require('express');
const {
  createOrder,
  getMyOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  getRestaurantStats,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Toute commande exige un token : le client est déduit de req.user, jamais du body.
router.use(protect);

router.post('/', authorize('client'), createOrder);
router.get('/my-orders', authorize('client'), getMyOrders);
router.get('/restaurant', authorize('restaurateur', 'admin'), getRestaurantOrders);
router.get('/stats/restaurant', authorize('restaurateur', 'admin'), getRestaurantStats);
// Accès à une commande et changement de statut vérifiés dans le contrôleur.
router.get('/:id', getOrderById);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
