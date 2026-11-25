/**
 * Normalise page / limit pour la pagination.
 */
const getPagination = (query) => {
  // page >= 1 ; limit bornée entre 1 et 100 pour éviter les grosses requêtes.
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

/**
 * Construit les métadonnées de pagination renvoyées au front-end.
 */
const buildMeta = (total, page, limit) => ({
  // pages >= 1 même sans résultat, pour que le front puisse paginer.
  total,
  page,
  limit,
  pages: Math.max(Math.ceil(total / limit), 1),
});

module.exports = { getPagination, buildMeta };
