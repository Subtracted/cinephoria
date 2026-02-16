const express = require('express');
const router = express.Router();
const { getRooms, getRoomById, createRoom, updateRoom, deleteRoom } = require('../controllers/roomController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// GET /api/rooms - Salles avec filtre par cinéma
router.get('/', getRooms);

// GET /api/rooms/:id - Détail d'une salle
router.get('/:id', getRoomById);

// POST /api/rooms - Créer une salle (admin/employé)
router.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  requireFields(['cinemaId', 'roomNumber', 'capacity', 'quality']),
  createRoom
);

// PUT /api/rooms/:id - Modifier une salle (admin/employé)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  updateRoom
);

// DELETE /api/rooms/:id - Supprimer une salle (admin/employé)
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  deleteRoom
);

module.exports = router;
