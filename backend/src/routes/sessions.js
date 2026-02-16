const express = require('express');
const router = express.Router();
const { getSessions, getSessionById, createSession, updateSession, deleteSession } = require('../controllers/sessionController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// GET /api/sessions - Séances avec filtres
router.get('/', getSessions);

// GET /api/sessions/:id - Détail d'une séance avec sièges
router.get('/:id', getSessionById);

// POST /api/sessions - Créer une séance (admin/employé)
router.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  requireFields(['filmId', 'roomId', 'startTime', 'endTime']),
  createSession
);

// PUT /api/sessions/:id - Modifier une séance (admin/employé)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  updateSession
);

// DELETE /api/sessions/:id - Supprimer une séance (admin/employé)
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  deleteSession
);

module.exports = router;
