const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Category = require('../models/Category');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/query');

/** Vérifie que l'utilisateur peut gérer ce restaurant. */
const assertCanManage = (restaurant, user) => {
  if (user.role === 'admin') return;
  // 403 : un restaurateur ne peut gérer que ses propres restaurants.
  if (user.role !== 'restaurateur' || !restaurant.owner.equals(user._id)) {
    const err = new Error('Vous ne pouvez gérer que vos propres restaurants.');
    err.status = 403;
    throw err;
  }
};

/**
 * GET /api/restaurants
 * Liste publique (restaurants validés). L'administrateur voit tout.
 */
const getRestaurants = asyncHandler(async (req, res) => {
  const { q, typeCuisine, open, sort } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // Visiteur : uniquement les restaurants validés ; admin : filtre statut libre.
  const isAdmin = req.user && req.user.role === 'admin';
  if (isAdmin) {
    if (req.query.statut) filter.statut = req.query.statut;
  } else {
    filter.statut = 'valide';
  }

  if (q) filter.nom = new RegExp(q, 'i');
  if (typeCuisine) filter.typeCuisine = new RegExp(`^${typeCuisine}$`, 'i');
  if (open === 'true') filter.isOpen = true;
  if (open === 'false') filter.isOpen = false;

  const sortOptions = {
    nom_asc: { nom: 1 },
    nom_desc: { nom: -1 },
    livraison: { fraisLivraison: 1 },
    recent: { createdAt: -1 },
  };
  const sortBy = sortOptions[sort] || { nom: 1 };

  const [data, total] = await Promise.all([
    Restaurant.find(filter)
      .populate('owner', 'nom prenom email')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  res.json({ data, meta: buildMeta(total, page, limit) });
});

/**
 * GET /api/restaurants/:id
 */
const getRestaurantById = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'nom prenom email');
  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant introuvable.');
  }

  const isOwner = req.user && restaurant.owner && restaurant.owner._id.equals(req.user._id);
  const isAdmin = req.user && req.user.role === 'admin';
  // 403 : un restaurant non validé n'est visible que du propriétaire ou de l'admin.
  if (restaurant.statut !== 'valide' && !isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Ce restaurant n’est pas encore validé.');
  }

  const [categories, dishes] = await Promise.all([
    Category.find({ restaurant: restaurant._id, type: 'plat' }).sort({ nom: 1 }),
    Dish.find({ restaurant: restaurant._id }).sort({ nom: 1 }),
  ]);

  res.json({ restaurant, categories, dishes });
});

/**
 * GET /api/restaurants/mine  (restaurateur)
 */
const getMyRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(restaurants);
});

/**
 * POST /api/restaurants
 * Restaurateur : crée son restaurant (en attente de validation).
 * Admin : peut créer pour un restaurateur et valider directement.
 */
const createRestaurant = asyncHandler(async (req, res) => {
  const { nom, description, adresse, typeCuisine, image, fraisLivraison, horaires, isOpen, owner } = req.body;

  if (!nom || !description || !adresse || !typeCuisine) {
    res.status(400);
    throw new Error('Nom, description, adresse et type de cuisine sont obligatoires.');
  }

  const restaurant = await Restaurant.create({
    nom,
    description,
    adresse,
    typeCuisine,
    image: image || '',
    fraisLivraison: Number(fraisLivraison) || 0,
    horaires: horaires || '10:00 - 23:00',
    isOpen: isOpen !== undefined ? isOpen : true,
    owner: req.user.role === 'admin' ? owner || req.user._id : req.user._id,
    // Statut imposé : en attente pour un restaurateur, valide pour l'admin.
    statut: req.user.role === 'admin' ? req.body.statut || 'valide' : 'en_attente',
  });

  res.status(201).json({ message: 'Restaurant créé.', restaurant });
});

/**
 * PUT /api/restaurants/:id
 * Un restaurateur ne peut modifier que ses restaurants (403 sinon).
 */
const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant introuvable.');
  }
  assertCanManage(restaurant, req.user);

  const fields = ['nom', 'description', 'adresse', 'typeCuisine', 'image', 'horaires'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) restaurant[field] = req.body[field];
  });
  if (req.body.fraisLivraison !== undefined) restaurant.fraisLivraison = Number(req.body.fraisLivraison);
  if (req.body.isOpen !== undefined) restaurant.isOpen = req.body.isOpen;

  // Seul l'administrateur peut modifier le propriétaire et le statut de validation
  if (req.user.role === 'admin') {
    if (req.body.owner !== undefined) restaurant.owner = req.body.owner;
    if (req.body.statut !== undefined) restaurant.statut = req.body.statut;
  }

  await restaurant.save();
  res.json({ message: 'Restaurant mis à jour.', restaurant });
});

/**
 * PUT /api/restaurants/:id/status  (admin)
 */
const updateRestaurantStatus = asyncHandler(async (req, res) => {
  const { statut } = req.body;
  // 400 : statut limité à en_attente / valide / suspendu (route admin uniquement).
  if (!['en_attente', 'valide', 'suspendu'].includes(statut)) {
    res.status(400);
    throw new Error('Statut invalide.');
  }

  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { statut },
    { new: true, runValidators: true }
  );
  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant introuvable.');
  }

  res.json({ message: 'Statut du restaurant mis à jour.', restaurant });
});

/**
 * DELETE /api/restaurants/:id
 * Suppression en cascade des catégories et des plats.
 */
const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) {
    res.status(404);
    throw new Error('Restaurant introuvable.');
  }
  assertCanManage(restaurant, req.user);

  // Les commandes passées sont conservées : seul le menu du restaurant est supprimé.
  await Promise.all([
    Dish.deleteMany({ restaurant: restaurant._id }),
    Category.deleteMany({ restaurant: restaurant._id }),
  ]);
  await restaurant.deleteOne();

  res.json({ message: 'Restaurant supprimé.' });
});

module.exports = {
  getRestaurants,
  getRestaurantById,
  getMyRestaurants,
  createRestaurant,
  updateRestaurant,
  updateRestaurantStatus,
  deleteRestaurant,
};
