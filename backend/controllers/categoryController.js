const Category = require('../models/Category');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/categories?type=cuisine
 * GET /api/categories?restaurant=ID
 */
const getCategories = asyncHandler(async (req, res) => {
  const filter = {};

  // Sans type explicite, un ?restaurant implique 'plat' ; 'cuisine' force restaurant:null.
  if (req.query.type) filter.type = req.query.type;
  else if (req.query.restaurant) filter.type = 'plat';

  if (req.query.restaurant) filter.restaurant = req.query.restaurant;
  if (req.query.type === 'cuisine') filter.restaurant = null;

  const categories = await Category.find(filter).sort({ nom: 1 });
  res.json(categories);
});

/**
 * POST /api/categories
 */
const createCategory = asyncHandler(async (req, res) => {
  const { nom, description, type } = req.body;

  if (!nom) {
    res.status(400);
    throw new Error('Le nom de la catégorie est obligatoire.');
  }

  // Catégorie générale de cuisine : administrateur uniquement
  if (type === 'cuisine') {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Seul l’administrateur gère les catégories de cuisine.');
    }
    const category = await Category.create({ nom, description, type: 'cuisine', restaurant: null });
    return res.status(201).json({ message: 'Catégorie créée.', category });
  }

  // Catégorie de plat : rattachée à un restaurant
  const { restaurant } = req.body;
  if (!restaurant) {
    res.status(400);
    throw new Error('Le restaurant est obligatoire pour une catégorie de plat.');
  }

  const resto = await Restaurant.findById(restaurant);
  if (!resto) {
    res.status(404);
    throw new Error('Restaurant introuvable.');
  }
  // 403 : seul le propriétaire (ou l'admin) peut ajouter une catégorie au menu.
  if (req.user.role !== 'admin' && !resto.owner.equals(req.user._id)) {
    res.status(403);
    throw new Error('Vous ne pouvez gérer que le menu de vos restaurants.');
  }

  const category = await Category.create({ nom, description, type: 'plat', restaurant });
  res.status(201).json({ message: 'Catégorie créée.', category });
});

/**
 * PUT /api/categories/:id
 * Catégorie "cuisine" : admin ; catégorie "plat" : propriétaire du restaurant.
 */
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Catégorie introuvable.');
  }

  if (category.type === 'cuisine') {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Seul l’administrateur gère les catégories de cuisine.');
    }
  } else {
    const resto = await Restaurant.findById(category.restaurant);
    if (req.user.role !== 'admin' && (!resto || !resto.owner.equals(req.user._id))) {
      res.status(403);
      throw new Error('Vous ne pouvez gérer que le menu de vos restaurants.');
    }
  }

  if (req.body.nom !== undefined) category.nom = req.body.nom;
  if (req.body.description !== undefined) category.description = req.body.description;
  await category.save();

  res.json({ message: 'Catégorie mise à jour.', category });
});

/**
 * DELETE /api/categories/:id
 * Mêmes droits que la mise à jour : admin ou propriétaire du restaurant.
 */
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error('Catégorie introuvable.');
  }

  if (category.type === 'cuisine') {
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Seul l’administrateur gère les catégories de cuisine.');
    }
  } else {
    const resto = await Restaurant.findById(category.restaurant);
    if (req.user.role !== 'admin' && (!resto || !resto.owner.equals(req.user._id))) {
      res.status(403);
      throw new Error('Vous ne pouvez gérer que le menu de vos restaurants.');
    }

    // 400 : des plats référencent encore cette catégorie.
    const count = await Dish.countDocuments({ categorie: category._id });
    if (count > 0) {
      res.status(400);
      throw new Error(`Impossible de supprimer : ${count} plat(s) utilisent cette catégorie.`);
    }
  }

  await category.deleteOne();
  res.json({ message: 'Catégorie supprimée.' });
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
