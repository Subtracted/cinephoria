/**
 * Middleware de gestion centralisée des erreurs
 * Capture toutes les erreurs non gérées et renvoie une réponse JSON
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Erreur] ${err.message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.message,
    });
  }

  // Erreurs de contrainte unique PostgreSQL
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Cette ressource existe déjà',
      details: err.detail,
    });
  }

  // Erreurs de clé étrangère PostgreSQL
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Référence invalide',
      details: err.detail,
    });
  }

  // Erreur générique
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Middleware pour les routes non trouvées
 */
const notFound = (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} non trouvée` });
};

module.exports = { errorHandler, notFound };
