const Dish = require('../models/Dish');
const Category = require('../models/Category');
const Restaurant = require('../models/Restaurant');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/query');

/** Charge le restaurant et vérifie les droits du restaurateur. */
const loadRestaurantForUser = async (restaurantId, user) => {
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    const err = new Error('Restaurant introuvable.');
    err.status = 404;
    throw err;
  }
  // 404 restaurant / 403 propriétaire : codes portés par err.status pour errorMiddleware.
  if (user.role !== 'admin' && !restaurant.owner.equals(user._id)) {
    const err = new Error('Vous ne pouvez gérer que le menu de vos restaurants.');
    err.status = 403;
    throw err;
  }
  return restaurant;
};

/**
 * GET /api/dishes?restaurant=ID&categorie=ID&q=&disponible=true
 */
const getDishes = asyncHandler(async (req, res) => {
  const { restaurant, categorie, q, disponible } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (restaurant) filter.restaurant = restaurant;
  if (categorie) filter.categorie = categorie;
  if (q) filter.$or = [{ nom: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
  // disponible n'est filtré que pour 'true' / 'false' ; sinon tous les plats sont renvoyés.
  if (disponible === 'true' || disponible === 'false') filter.disponible = disponible === 'true';

  const [data, total] = await Promise.all([
    Dish.find(filter)
      .populate('categorie', 'nom')
      .populate('restaurant', 'nom')
      .sort({ nom: 1 })
      .skip(skip)
      .limit(limit),
    Dish.countDocuments(filter),
  ]);

  res.json({ data, meta: buildMeta(total, page, limit) });
});

/**
 * GET /api/dishes/:id
 */
const getDishById = asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id).populate('categorie', 'nom').populate('restaurant', 'nom');
  if (!dish) {
    res.status(404);
    throw new Error('Plat introuvable.');
  }
  res.json(dish);
});

/**
 * POST /api/dishes
 */
const createDish = asyncHandler(async (req, res) => {
  const { nom, description, prix, image, disponible, categorie, restaurant } = req.body;

  if (!nom || prix === undefined || !categorie || !restaurant) {
    res.status(400);
    throw new Error('Nom, prix, catégorie et restaurant sont obligatoires.');
  }

  await loadRestaurantForUser(restaurant, req.user);

  const category = await Category.findById(categorie);
  if (!category) {
    res.status(404);
    throw new Error('Catégorie introuvable.');
  }
  // 400 : la catégorie doit appartenir au restaurant du plat.
  if (!category.restaurant || !category.restaurant.equals(restaurant)) {
    res.status(400);
    throw new Error('Cette catégorie n’appartient pas à ce restaurant.');
  }

  const dish = await Dish.create({
    nom,
    description,
    prix: Number(prix),
    image: image || '',
    disponible: disponible !== undefined ? disponible : true,
    categorie,
    restaurant,
  });

  res.status(201).json({ message: 'Plat ajouté.', dish });
});

/**
 * PUT /api/dishes/:id
 */
const updateDish = asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    res.status(404);
    throw new Error('Plat introuvable.');
  }

  await loadRestaurantForUser(dish.restaurant, req.user);

  if (req.body.categorie !== undefined) {
    const category = await Category.findById(req.body.categorie);
    // 400 : une nouvelle catégorie doit rester dans le même restaurant.
    if (!category || !category.restaurant || !category.restaurant.equals(dish.restaurant)) {
      res.status(400);
      throw new Error('Cette catégorie n’appartient pas à ce restaurant.');
    }
    dish.categorie = req.body.categorie;
  }

  ['nom', 'description', 'image'].forEach((field) => {
    if (req.body[field] !== undefined) dish[field] = req.body[field];
  });
  if (req.body.prix !== undefined) dish.prix = Number(req.body.prix);
  if (req.body.disponible !== undefined) dish.disponible = req.body.disponible;

  await dish.save();
  res.json({ message: 'Plat mis à jour.', dish });
});

/**
 * PUT /api/dishes/:id/availability
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    res.status(404);
    throw new Error('Plat introuvable.');
  }
  await loadRestaurantForUser(dish.restaurant, req.user);

  // Sans booléen explicite, on inverse la disponibilité courante.
  dish.disponible = typeof req.body.disponible === 'boolean' ? req.body.disponible : !dish.disponible;
  await dish.save();

  res.json({
    message: dish.disponible ? 'Plat rendu disponible.' : 'Plat marqué indisponible.',
    dish,
  });
});

/**
 * DELETE /api/dishes/:id
 */
const deleteDish = asyncHandler(async (req, res) => {
  const dish = await Dish.findById(req.params.id);
  if (!dish) {
    res.status(404);
    throw new Error('Plat introuvable.');
  }
  await loadRestaurantForUser(dish.restaurant, req.user);

  await dish.deleteOne();
  res.json({ message: 'Plat supprimé.' });
});

module.exports = {
  getDishes,
  getDishById,
  createDish,
  updateDish,
  toggleAvailability,
  deleteDish,
};
