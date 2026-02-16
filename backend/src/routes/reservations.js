const express = require('express');
const router = express.Router();
const { createReservation, getMyReservations, cancelReservation, getReservationById } = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');
const { requireFields } = require('../middleware/validate');

// GET /api/reservations/me - Mes réservations
router.get('/me', authenticate, getMyReservations);

// GET /api/reservations/:id - Détail d'une réservation
router.get('/:id', authenticate, getReservationById);

// POST /api/reservations - Créer une réservation
router.post(
  '/',
  authenticate,
  requireFields(['sessionId', 'seatIds']),
  createReservation
);

// PUT /api/reservations/:id/cancel - Annuler une réservation
router.put('/:id/cancel', authenticate, cancelReservation);

module.exports = router;
