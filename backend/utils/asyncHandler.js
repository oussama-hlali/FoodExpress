/**
 * Enveloppe un contrôleur async pour transmettre les erreurs au middleware global.
 */
const asyncHandler = (fn) => (req, res, next) => {
  // Les contrôleurs posent res.status avant throw ; errorMiddleware le relit.
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
