const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/stats/admin  (admin)
 * Statistiques générales de la plateforme.
 */
const getAdminStats = asyncHandler(async (req, res) => {
  const [
    clients,
    restaurateurs,
    restaurants,
    pendingRestaurants,
    orders,
    revenueAgg,
    ordersByStatus,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments({ role: 'client' }),
    User.countDocuments({ role: 'restaurateur' }),
    Restaurant.countDocuments({}),
    Restaurant.countDocuments({ statut: 'en_attente' }),
    Order.countDocuments({}),
    Order.aggregate([
      { $match: { statut: 'livree' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$statut', count: { $sum: 1 } } }]),
    Order.find({})
      .populate('client', 'nom prenom')
      .populate('restaurant', 'nom')
      .sort({ createdAt: -1 })
      .limit(6),
  ]);

  res.json({
    clients,
    restaurateurs,
    restaurants,
    pendingRestaurants,
    orders,
    revenue: revenueAgg[0]?.total || 0,
    ordersByStatus: ordersByStatus.reduce((acc, row) => {
      acc[row._id] = row.count;
      return acc;
    }, {}),
    recentOrders,
  });
});

/**
 * GET /api/stats/public  (visiteur)
 * Chiffres affichés sur la page d'accueil.
 */
const getPublicStats = asyncHandler(async (req, res) => {
  const [restaurants, dishes, orders] = await Promise.all([
    Restaurant.countDocuments({ statut: 'valide' }),
    Dish.countDocuments({ disponible: true }),
    Order.countDocuments({}),
  ]);
  res.json({ restaurants, dishes, orders });
});

module.exports = { getAdminStats, getPublicStats };
