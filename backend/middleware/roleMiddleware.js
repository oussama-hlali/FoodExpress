/**
 * Restreint l'accès à une route à certains rôles.
 * Exemple : authorize('restaurateur', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  // 401 si req.user absent, 403 si le rôle n'est pas autorisé.
  if (!req.user) {
    res.status(401);
    return next(new Error('Authentification requise.'));
  }

  if (!roles.includes(req.user.role)) {
    res.status(403);
    return next(new Error('Vous n’avez pas les droits nécessaires pour cette action.'));
  }

  next();
};

module.exports = { authorize };
