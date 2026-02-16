/**
 * Middleware de validation des données entrantes
 */

/**
 * Valide les champs requis dans le body de la requête
 * @param {string[]} fields - Liste des champs requis
 */
const requireFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Champs requis manquants',
        fields: missing,
      });
    }
    next();
  };
};

/**
 * Valide le format email
 */
const validateEmail = (req, res, next) => {
  const { email } = req.body;
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Format d\'email invalide' });
    }
  }
  next();
};

/**
 * Valide la force du mot de passe
 * 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
 */
const validatePassword = (req, res, next) => {
  const { password } = req.body;
  if (password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au minimum 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
      });
    }
  }
  next();
};

/**
 * Nettoie les entrées pour prévenir les injections XSS
 */
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .trim();
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);
  next();
};

module.exports = { requireFields, validateEmail, validatePassword, sanitizeInput };
