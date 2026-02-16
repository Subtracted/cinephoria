const express = require('express');
const router = express.Router();
const { createEmployee, resetEmployeePassword, getDashboard, getEmployees, syncStats } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, validateEmail, validatePassword, sanitizeInput } = require('../middleware/validate');

// Toutes les routes admin nécessitent l'authentification + rôle admin
router.use(authenticate, authorize('admin'));

// GET /api/admin/dashboard - Dashboard statistiques
router.get('/dashboard', getDashboard);

// GET /api/admin/employees - Liste des employés
router.get('/employees', getEmployees);

// POST /api/admin/employees - Créer un employé
router.post(
  '/employees',
  sanitizeInput,
  requireFields(['email', 'password', 'firstName', 'lastName', 'username', 'cinemaId']),
  validateEmail,
  validatePassword,
  createEmployee
);

// PUT /api/admin/employees/:id/reset-password - Réinitialiser mot de passe employé
router.put(
  '/employees/:id/reset-password',
  sanitizeInput,
  requireFields(['newPassword']),
  validatePassword,
  resetEmployeePassword
);

// POST /api/admin/sync-stats - Resynchroniser les stats MongoDB depuis PostgreSQL
router.post('/sync-stats', syncStats);

module.exports = router;
