const Order = require('../models/Order');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/query');

/** Cycle de vie d'une commande (règle 8). */
const TRANSITIONS = {
  en_attente: ['acceptee', 'refusee', 'annulee'],
  acceptee: ['en_preparation', 'annulee'],
  en_preparation: ['prete'],
  prete: ['en_livraison'],
  en_livraison: ['livree'],
  livree: [],
  refusee: [],
  annulee: [],
};

const canAccessOrder = (order, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'client') return order.client._id ? order.client._id.equals(user._id) : order.client.equals(user._id);
  return true; // restaurateur : vérifié plus bas via le restaurant
};

/**
 * POST /api/orders
 * Le total est toujours calculé côté serveur (règle 6).
 */
const createOrder = asyncHandler(async (req, res) => {
  const { restaurant: restaurantId, articles, adresseLivraison, telephone, remarque, modePaiement } = req.body;

  if (!restaurantId) {
    res.status(400);
    throw new Error('Le restaurant est obligatoire.');
  }
  if (!Array.isArray(articles) || articles.length === 0) {
    res.status(400);
    throw new Error('Une commande doit contenir au moins un article.');
  }
  if (!adresseLivraison || !adresseLivraison.trim()) {
    res.status(400);
    throw new Error("L'adresse de livraison est obligatoire.");
  }
  if (modePaiement && !['livraison', 'en_ligne'].includes(modePaiement)) {
    res.status(400);
    throw new Error('Mode de paiement invalide.');
  }

  // 404 : on ne commande que dans un restaurant validé.
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || restaurant.statut !== 'valide') {
    res.status(404);
    throw new Error('Restaurant indisponible.');
  }

  // Les plats sont rechargés en base : le client ne peut imposer ni prix ni nom.
  const ids = articles.map((a) => a.plat);
  const dishes = await Dish.find({ _id: { $in: ids }, restaurant: restaurant._id });
  const dishMap = new Map(dishes.map((d) => [String(d._id), d]));

  const lignes = articles.map((article) => {
    const dish = dishMap.get(String(article.plat));
    if (!dish) {
      const err = new Error('Un plat de la commande n’existe plus dans ce restaurant.');
      err.status = 400;
      throw err;
    }
    if (!dish.disponible) {
      const err = new Error(`Le plat « ${dish.nom} » n’est pas disponible.`);
      err.status = 400;
      throw err;
    }

    const quantite = Number(article.quantite);
    if (!Number.isInteger(quantite) || quantite < 1) {
      const err = new Error('La quantité de chaque article doit être un entier supérieur ou égal à 1.');
      err.status = 400;
      throw err;
    }

    return {
      plat: dish._id,
      nom: dish.nom, // nom figé au moment de l'achat
      quantite,
      prixUnitaire: dish.prix, // prix figé, jamais celui envoyé par le client
      image: dish.image,
    };
  });

  const sousTotal = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
  // Frais de livraison pris au restaurant, jamais dans le body du client.
  const fraisLivraison = restaurant.fraisLivraison;
  const total = Math.round((sousTotal + fraisLivraison) * 100) / 100;

  const order = await Order.create({
    client: req.user._id,
    restaurant: restaurant._id,
    articles: lignes,
    adresseLivraison: adresseLivraison.trim(),
    telephone: telephone ? String(telephone).trim() : req.user.telephone,
    sousTotal: Math.round(sousTotal * 100) / 100,
    fraisLivraison,
    total,
    modePaiement: modePaiement || 'livraison',
    remarque: remarque ? String(remarque).trim() : '',
    statut: 'en_attente',
  });

  const populated = await order.populate([
    { path: 'restaurant', select: 'nom adresse image fraisLivraison telephone' },
    { path: 'client', select: 'nom prenom email telephone' },
  ]);

  res.status(201).json({ message: 'Commande confirmée.', order: populated });
});

/**
 * GET /api/orders/my-orders  (client)
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  // Un client ne voit que ses propres commandes ; filtre statut optionnel.
  const filter = { client: req.user._id };
  if (req.query.statut) filter.statut = req.query.statut;

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'nom adresse image fraisLivraison')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ data, meta: buildMeta(total, page, limit) });
});

/**
 * GET /api/orders/restaurant  (restaurateur)
 * Commandes reçues sur les restaurants de l'utilisateur.
 */
const getRestaurantOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  // Admin : tous les restaurants ; restaurateur : les siens uniquement.
  const restaurants = await Restaurant.find(
    req.user.role === 'admin' ? {} : { owner: req.user._id }
  ).select('_id');

  const filter = { restaurant: { $in: restaurants.map((r) => r._id) } };
  if (req.query.statut) filter.statut = req.query.statut;
  if (req.query.restaurant) filter.restaurant = req.query.restaurant;

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate('client', 'nom prenom email telephone')
      .populate('restaurant', 'nom adresse')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  res.json({ data, meta: buildMeta(total, page, limit) });
});

/**
 * GET /api/orders/:id
 */
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'nom prenom email telephone')
    .populate('restaurant', 'nom adresse image fraisLivraison owner');

  if (!order) {
    res.status(404);
    throw new Error('Commande introuvable.');
  }

  // 403 : client = auteur de la commande, restaurateur = propriétaire du restaurant.
  if (!canAccessOrder(order, req.user)) {
    res.status(403);
    throw new Error('Accès refusé à cette commande.');
  }

  if (req.user.role === 'restaurateur' && !order.restaurant.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error('Accès refusé à cette commande.');
  }

  res.json(order);
});

/**
 * PUT /api/orders/:id/status
 * Client : annulation en attente seulement ; transitions validées par TRANSITIONS.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { statut, motifRefus } = req.body;
  const order = await Order.findById(req.params.id).populate('restaurant', 'owner nom');

  if (!order) {
    res.status(404);
    throw new Error('Commande introuvable.');
  }

  // Une commande livrée ne peut plus être modifiée (règle 9)
  if (order.statut === 'livree' || order.statut === 'refusee' || order.statut === 'annulee') {
    res.status(400);
    throw new Error('Cette commande est clôturée et ne peut plus être modifiée.');
  }

  if (req.user.role === 'client') {
    if (!order.client.equals(req.user._id)) {
      res.status(403);
      throw new Error('Accès refusé à cette commande.');
    }
    if (statut !== 'annulee' || order.statut !== 'en_attente') {
      res.status(403);
      throw new Error('Vous pouvez uniquement annuler une commande en attente.');
    }
  } else if (req.user.role === 'restaurateur') {
    if (!order.restaurant.owner.equals(req.user._id)) {
      res.status(403);
      throw new Error('Vous ne pouvez gérer que les commandes de vos restaurants.');
    }
  }

  // 400 : toute transition hors cycle de vie est refusée.
  const allowed = TRANSITIONS[order.statut] || [];
  if (!allowed.includes(statut)) {
    res.status(400);
    throw new Error(`Transition impossible : ${order.statut} → ${statut}.`);
  }

  order.statut = statut;
  // Le motif n'est conservé que lors d'un refus.
  if (statut === 'refusee' && motifRefus) order.motifRefus = String(motifRefus).trim();
  await order.save();

  res.json({ message: 'Statut de la commande mis à jour.', order });
});

/**
 * GET /api/orders/stats/restaurant  (restaurateur)
 */
const getRestaurantStats = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find(
    req.user.role === 'admin' ? {} : { owner: req.user._id }
  ).select('_id');

  const restaurantIds = restaurants.map((r) => r._id);
  const match = { restaurant: { $in: restaurantIds } };
  // Revenu : uniquement les commandes livrées ; top plats hors refus / annulations.

  const [total, pending, accepted, delivered, revenueAgg, topDishes, recentOrders] = await Promise.all([
    Order.countDocuments(match),
    Order.countDocuments({ ...match, statut: 'en_attente' }),
    Order.countDocuments({ ...match, statut: { $in: ['acceptee', 'en_preparation', 'prete', 'en_livraison'] } }),
    Order.countDocuments({ ...match, statut: 'livree' }),
    Order.aggregate([
      { $match: { ...match, statut: 'livree' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.aggregate([
      { $match: { ...match, statut: { $nin: ['refusee', 'annulee'] } } },
      { $unwind: '$articles' },
      {
        $group: {
          _id: '$articles.nom',
          quantite: { $sum: '$articles.quantite' },
          revenu: { $sum: { $multiply: ['$articles.quantite', '$articles.prixUnitaire'] } },
        },
      },
      { $sort: { quantite: -1 } },
      { $limit: 5 },
    ]),
    Order.find(match)
      .populate('client', 'nom prenom')
      .populate('restaurant', 'nom')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.json({
    totalOrders: total,
    pendingOrders: pending,
    acceptedOrders: accepted,
    deliveredOrders: delivered,
    revenue: revenueAgg[0]?.total || 0,
    topDishes,
    recentOrders,
  });
});

module.exports = {
  createOrder,
  getMyOrders,
  getRestaurantOrders,
  getOrderById,
  updateOrderStatus,
  getRestaurantStats,
  TRANSITIONS,
};
