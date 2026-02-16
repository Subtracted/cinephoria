const express = require('express');
const router = express.Router();
const { register, login, getProfile, forgotPassword, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { requireFields, validateEmail, validatePassword, sanitizeInput } = require('../middleware/validate');

// POST /api/auth/register - Inscription
router.post(
  '/register',
  sanitizeInput,
  requireFields(['email', 'password', 'firstName', 'lastName', 'username']),
  validateEmail,
  validatePassword,
  register
);

// POST /api/auth/login - Connexion
router.post(
  '/login',
  sanitizeInput,
  requireFields(['email', 'password']),
  login
);

// GET /api/auth/me - Profil utilisateur
router.get('/me', authenticate, getProfile);

// POST /api/auth/forgot-password - Mot de passe oublié
router.post(
  '/forgot-password',
  sanitizeInput,
  requireFields(['email']),
  validateEmail,
  forgotPassword
);

// PUT /api/auth/change-password - Changer mot de passe
router.put(
  '/change-password',
  authenticate,
  sanitizeInput,
  requireFields(['currentPassword', 'newPassword']),
  validatePassword,
  changePassword
);

module.exports = router;
