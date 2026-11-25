const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Vérifie le token JWT et charge l'utilisateur courant.
 * Un compte désactivé ne peut plus accéder à son espace (règle 10).
 */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Accès refusé : token manquant.');
  }

  let payload;
  try {
    payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch (error) {
    res.status(401);
    throw new Error('Session expirée ou token invalide.');
  }

  const user = await User.findById(payload.id);
  if (!user) {
    res.status(401);
    throw new Error("Ce compte n'existe plus.");
  }

  // 403 (et non 401) : le compte existe mais est désactivé.
  if (!user.isActive) {
    res.status(403);
    throw new Error('Compte désactivé. Contactez l’administrateur.');
  }

  req.user = user;
  next();
});

module.exports = { protect };
