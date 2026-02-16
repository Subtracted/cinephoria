const express = require('express');
const router = express.Router();
const { getAllCinemas, getCinemaById } = require('../controllers/cinemaController');

// GET /api/cinemas - Liste des cinémas
router.get('/', getAllCinemas);

// GET /api/cinemas/:id - Détail d'un cinéma
router.get('/:id', getCinemaById);

module.exports = router;
