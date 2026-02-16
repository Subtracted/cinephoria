const { query } = require('../config/db');

/**
 * Récupérer tous les cinémas
 * GET /api/cinemas
 */
const getAllCinemas = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, city, country, address, phone, opening_hours FROM cinemas ORDER BY country, city'
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un cinéma par ID
 * GET /api/cinemas/:id
 */
const getCinemaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, name, city, country, address, phone, opening_hours FROM cinemas WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cinéma non trouvé' });
    }

    // Récupérer les salles du cinéma
    const rooms = await query(
      'SELECT id, room_number, capacity, quality FROM rooms WHERE cinema_id = $1 ORDER BY room_number',
      [id]
    );

    res.json({ ...result.rows[0], rooms: rooms.rows });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllCinemas, getCinemaById };
