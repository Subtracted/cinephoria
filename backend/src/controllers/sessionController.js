const { query } = require('../config/db');

/**
 * Récupérer les séances par cinéma et film
 * GET /api/sessions?cinema=&film=
 */
const getSessions = async (req, res, next) => {
  try {
    const { cinema, film } = req.query;

    let sql = `
      SELECT s.id, s.start_time, s.end_time,
             f.id AS film_id, f.title AS film_title, f.duration, f.poster_url,
             rm.id AS room_id, rm.room_number, rm.quality, rm.capacity,
             c.id AS cinema_id, c.name AS cinema_name, c.city,
             qp.price,
             rm.capacity - COALESCE(booked.count, 0) AS available_seats
      FROM sessions s
      JOIN films f ON f.id = s.film_id
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      JOIN quality_prices qp ON qp.quality = rm.quality
      LEFT JOIN (
        SELECT res.session_id, SUM(res.num_seats) AS count
        FROM reservations res
        WHERE res.status IN ('confirmed', 'pending')
        GROUP BY res.session_id
      ) booked ON booked.session_id = s.id
      WHERE s.start_time > NOW()
    `;

    const params = [];
    let paramIndex = 1;

    if (cinema) {
      sql += ` AND c.id = $${paramIndex++}`;
      params.push(cinema);
    }

    if (film) {
      sql += ` AND f.id = $${paramIndex++}`;
      params.push(film);
    }

    sql += ` ORDER BY s.start_time`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une séance par ID avec les sièges disponibles
 * GET /api/sessions/:id
 */
const getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer la séance
    const sessionResult = await query(`
      SELECT s.id, s.start_time, s.end_time,
             f.id AS film_id, f.title AS film_title, f.duration, f.poster_url, f.description,
             rm.id AS room_id, rm.room_number, rm.quality, rm.capacity,
             c.id AS cinema_id, c.name AS cinema_name, c.city,
             qp.price
      FROM sessions s
      JOIN films f ON f.id = s.film_id
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      JOIN quality_prices qp ON qp.quality = rm.quality
      WHERE s.id = $1
    `, [id]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }

    // Récupérer les sièges avec leur statut de disponibilité
    const seatsResult = await query(`
      SELECT st.id, st.seat_number, st.seat_row, st.is_pmr, st.is_available,
             CASE WHEN rs.id IS NOT NULL THEN FALSE ELSE TRUE END AS is_free
      FROM seats st
      LEFT JOIN (
        SELECT rs.seat_id, rs.id
        FROM reservation_seats rs
        JOIN reservations res ON res.id = rs.reservation_id
        WHERE res.session_id = $1 AND res.status IN ('confirmed', 'pending')
      ) rs ON rs.seat_id = st.id
      WHERE st.room_id = $2
      ORDER BY st.seat_row, st.seat_number
    `, [id, sessionResult.rows[0].room_id]);

    res.json({
      ...sessionResult.rows[0],
      seats: seatsResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une séance (admin/employé)
 * POST /api/sessions
 */
const createSession = async (req, res, next) => {
  try {
    const { filmId, roomId, startTime, endTime } = req.body;

    // Vérifier les conflits de salle
    const conflict = await query(`
      SELECT id FROM sessions
      WHERE room_id = $1
        AND ((start_time, end_time) OVERLAPS ($2::timestamp, $3::timestamp))
    `, [roomId, startTime, endTime]);

    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Cette salle est déjà occupée sur ce créneau' });
    }

    const result = await query(
      `INSERT INTO sessions (film_id, room_id, start_time, end_time)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [filmId, roomId, startTime, endTime]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Modifier une séance (admin/employé)
 * PUT /api/sessions/:id
 */
const updateSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { filmId, roomId, startTime, endTime } = req.body;

    const result = await query(
      `UPDATE sessions SET film_id = $1, room_id = $2, start_time = $3, end_time = $4
       WHERE id = $5 RETURNING *`,
      [filmId, roomId, startTime, endTime, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une séance (admin/employé)
 * DELETE /api/sessions/:id
 */
const deleteSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM sessions WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Séance non trouvée' });
    }

    res.json({ message: 'Séance supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSessions, getSessionById, createSession, updateSession, deleteSession };
