const express = require('express');
const router = express.Router();
const { getAllFilms, getLatestFilms, getFilmById, createFilm, updateFilm, deleteFilm, getGenres } = require('../controllers/filmController');
const { authenticate, authorize } = require('../middleware/auth');
const { requireFields, sanitizeInput } = require('../middleware/validate');

// GET /api/films/latest - Films de la semaine (page d'accueil)
router.get('/latest', getLatestFilms);

// GET /api/films/genres - Genres disponibles
router.get('/genres', getGenres);

// GET /api/films - Tous les films avec filtres
router.get('/', getAllFilms);

// GET /api/films/:id - Détail d'un film
router.get('/:id', getFilmById);

// POST /api/films - Créer un film (admin/employé)
router.post(
  '/',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  requireFields(['title', 'genre', 'duration']),
  createFilm
);

// PUT /api/films/:id - Modifier un film (admin/employé)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  sanitizeInput,
  updateFilm
);

// DELETE /api/films/:id - Supprimer un film (admin/employé)
router.delete(
  '/:id',
  authenticate,
  authorize('admin', 'employee'),
  deleteFilm
);

module.exports = router;
