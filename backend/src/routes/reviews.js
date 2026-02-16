const express = require('express');
const router = express.Router();
const { createReview, getPendingReviews, moderateReview, deleteReview } = require('../controllers/reviewController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// POST /api/reviews - Créer un avis (utilisateur)
router.post(
  '/',
  authenticate,
  sanitizeInput,
  requireFields(['filmId', 'reservationId', 'rating']),
  createReview
);

// GET /api/reviews/pending - Avis en attente (employé)
router.get('/pending', authenticate, authorize('employee', 'admin'), getPendingReviews);

// PUT /api/reviews/:id/moderate - Modérer un avis (employé)
router.put('/:id/moderate', authenticate, authorize('employee', 'admin'), moderateReview);

// DELETE /api/reviews/:id - Supprimer un avis (employé)
router.delete('/:id', authenticate, authorize('employee', 'admin'), deleteReview);

module.exports = router;
