const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, buildMeta } = require('../utils/query');

/**
 * GET /api/users  (admin)
 * Liste / recherche des utilisateurs.
 */
const getUsers = asyncHandler(async (req, res) => {
  const { q, role, isActive } = req.query;
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  // q : recherche insensible à la casse sur nom / prénom / email.
  if (q) {
    filter.$or = [
      { nom: new RegExp(q, 'i') },
      { prenom: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }
  if (role) filter.role = role;
  // isActive n'est filtré que pour 'true' / 'false' ; les autres valeurs sont ignorées.
  if (isActive === 'true' || isActive === 'false') filter.isActive = isActive === 'true';

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ data: users, meta: buildMeta(total, page, limit) });
});

/**
 * GET /api/users/:id  (admin)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable.');
  }
  res.json(user);
});

/**
 * PUT /api/users/:id/status  (admin)
 * Activer / désactiver un compte.
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable.');
  }

  // 400 : un admin ne peut pas désactiver son propre compte.
  if (user._id.equals(req.user._id)) {
    res.status(400);
    throw new Error('Vous ne pouvez pas désactiver votre propre compte.');
  }

  // Sans booléen explicite, on inverse simplement l'état courant.
  if (typeof req.body.isActive === 'boolean') {
    user.isActive = req.body.isActive;
  } else {
    user.isActive = !user.isActive;
  }
  await user.save();

  res.json({ message: `Compte ${user.isActive ? 'activé' : 'désactivé'}.`, user });
});

/**
 * PUT /api/users/:id/role  (admin)
 * Promouvoir un utilisateur en restaurateur (ou changer son rôle).
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  // 400 : seuls client / restaurateur / admin sont acceptés.
  if (!['client', 'restaurateur', 'admin'].includes(role)) {
    res.status(400);
    throw new Error('Rôle invalide.');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('Utilisateur introuvable.');
  }

  // 400 : un admin ne peut pas se retirer son propre rôle administrateur.
  if (user._id.equals(req.user._id) && role !== 'admin') {
    res.status(400);
    throw new Error('Vous ne pouvez pas retirer votre propre rôle administrateur.');
  }

  user.role = role;
  await user.save();

  res.json({ message: 'Rôle mis à jour.', user });
});

module.exports = { getUsers, getUserById, toggleUserStatus, updateUserRole };
