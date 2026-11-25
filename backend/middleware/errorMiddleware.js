const notFound = (req, res) => {
  res.status(404).json({ message: `Route introuvable : ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Erreur interne du serveur';

  // Erreurs de validation Mongoose
  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  }

  // CastError : identifiant mal formé
  if (err.name === 'CastError') {
    status = 400;
    message = 'Identifiant invalide.';
  }

  // Doublon (email unique, catégorie unique...)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'champ';
    message = `Cette valeur est déjà utilisée (${field}).`;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${req.method} ${req.originalUrl}]`, err.message);
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
