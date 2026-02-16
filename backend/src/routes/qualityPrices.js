const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET /api/quality-prices - Tarifs par qualité
router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT id, quality, price, description FROM quality_prices ORDER BY price');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
