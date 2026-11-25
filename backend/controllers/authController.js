const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// Le JWT embarque id et rôle ; l'expiration vient de l'environnement (7d par défaut).
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Règle partagée inscription / changement de mot de passe : 8 caractères, lettre et chiffre.
const passwordIsStrong = (password) =>
  typeof password === 'string' && password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

/**
 * POST /api/auth/register
 * Inscription d'un client (rôle "client" par défaut).
 */
const register = asyncHandler(async (req, res) => {
  const { nom, prenom, email, telephone, password, confirmPassword } = req.body;

  if (!nom || !prenom || !email || !telephone || !password || !confirmPassword) {
    res.status(400);
    throw new Error('Tous les champs sont obligatoires.');
  }

  if (!passwordIsStrong(password)) {
    res.status(400);
    throw new Error('Le mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.');
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error('La confirmation du mot de passe ne correspond pas.');
  }

  // Email normalisé : unicité appliquée en minuscules et sans espaces.
  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) {
    res.status(409);
    throw new Error('Cette adresse email est déjà utilisée.');
  }

  const user = await User.create({
    nom,
    prenom,
    email,
    telephone,
    password,
    role: 'client', // rôle imposé : un visiteur ne peut pas s'inscrire comme admin
  });

  res.status(201).json({
    message: 'Compte créé avec succès.',
    token: signToken(user),
    user,
  });
});

/**
 * POST /api/auth/login
 * Vérifie les identifiants et renvoie un JWT.
 * 401 si identifiants invalides, 403 si le compte est désactivé.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email et mot de passe obligatoires.');
  }

  // 401 générique : on ne révèle pas si l'email existe réellement.
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Email ou mot de passe incorrect.');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Votre compte est désactivé. Contactez l’administrateur.');
  }

  res.json({
    message: 'Connexion réussie.',
    token: signToken(user),
    user,
  });
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

/**
 * PUT /api/auth/profile
 * Modifie nom / prénom / téléphone uniquement (ni email, ni rôle).
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { nom, prenom, telephone } = req.body;

  if (!nom || !prenom || !telephone) {
    res.status(400);
    throw new Error('Nom, prénom et téléphone sont obligatoires.');
  }

  const user = await User.findById(req.user._id);
  user.nom = nom.trim();
  user.prenom = prenom.trim();
  user.telephone = telephone.trim();
  await user.save();

  res.json({ message: 'Profil mis à jour.', user });
});

/**
 * PUT /api/auth/password
 * Exige l'ancien mot de passe ; le nouveau doit être fort et confirmé.
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Tous les champs sont obligatoires.');
  }

  if (!passwordIsStrong(newPassword)) {
    res.status(400);
    throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères, dont une lettre et un chiffre.');
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('La confirmation ne correspond pas au nouveau mot de passe.');
  }

  const user = await User.findById(req.user._id).select('+password');
  // 400 (et non 401) : l'utilisateur est déjà authentifié.
  if (!(await user.matchPassword(currentPassword))) {
    res.status(400);
    throw new Error('Mot de passe actuel incorrect.');
  }

  user.password = newPassword;
  await user.save();

  res.json({ message: 'Mot de passe modifié.' });
});

module.exports = { register, login, getMe, updateProfile, changePassword };
