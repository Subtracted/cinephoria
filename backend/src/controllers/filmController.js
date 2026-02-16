const { query } = require('../config/db');

/**
 * Récupérer tous les films avec filtres optionnels
 * GET /api/films?cinema=&genre=&day=
 */
const getAllFilms = async (req, res, next) => {
  try {
    const { cinema, genre, day } = req.query;

    let sql = `
      SELECT DISTINCT f.id, f.title, f.description, f.poster_url, f.min_age,
             f.is_coup_de_coeur, f.genre, f.duration, f.added_date,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM films f
      LEFT JOIN reviews r ON r.film_id = f.id AND r.status = 'approved'
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    // Filtre par cinéma : films ayant au moins une séance dans ce cinéma
    if (cinema) {
      sql += ` JOIN sessions s ON s.film_id = f.id JOIN rooms rm ON rm.id = s.room_id`;
      conditions.push(`rm.cinema_id = $${paramIndex++}`);
      params.push(cinema);
    }

    // Filtre par genre
    if (genre) {
      conditions.push(`f.genre = $${paramIndex++}`);
      params.push(genre);
    }

    // Filtre par jour (séances ce jour-là)
    if (day) {
      if (!cinema) {
        sql += ` JOIN sessions s ON s.film_id = f.id`;
      }
      conditions.push(`DATE(s.start_time) = $${paramIndex++}`);
      params.push(day);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ` + conditions.join(' AND ');
    }

    sql += ` GROUP BY f.id ORDER BY f.added_date DESC, f.title`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les films de la dernière semaine (page d'accueil)
 * Ajoutés le dernier mercredi
 * GET /api/films/latest
 */
const getLatestFilms = async (req, res, next) => {
  try {
    // Trouver le dernier mercredi (jour 3 en PostgreSQL, lundi = 1)
    const result = await query(`
      SELECT f.id, f.title, f.description, f.poster_url, f.min_age,
             f.is_coup_de_coeur, f.genre, f.duration, f.added_date,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS rating
      FROM films f
      LEFT JOIN reviews r ON r.film_id = f.id AND r.status = 'approved'
      WHERE f.added_date = (
        CURRENT_DATE - ((EXTRACT(ISODOW FROM CURRENT_DATE)::int + 4) % 7) * INTERVAL '1 day'
      )::date
      GROUP BY f.id
      ORDER BY f.title
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer un film par ID avec ses séances
 * GET /api/films/:id
 */
const getFilmById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Récupérer le film
    const filmResult = await query(`
      SELECT f.id, f.title, f.description, f.poster_url, f.min_age,
             f.is_coup_de_coeur, f.genre, f.duration, f.added_date,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS rating,
             COUNT(DISTINCT r.id) AS review_count
      FROM films f
      LEFT JOIN reviews r ON r.film_id = f.id AND r.status = 'approved'
      WHERE f.id = $1
      GROUP BY f.id
    `, [id]);

    if (filmResult.rows.length === 0) {
      return res.status(404).json({ error: 'Film non trouvé' });
    }

    // Récupérer les séances à venir
    const sessionsResult = await query(`
      SELECT s.id, s.start_time, s.end_time,
             rm.room_number, rm.quality,
             c.id AS cinema_id, c.name AS cinema_name, c.city,
             qp.price,
             rm.capacity - COALESCE(booked.count, 0) AS available_seats
      FROM sessions s
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      JOIN quality_prices qp ON qp.quality = rm.quality
      LEFT JOIN (
        SELECT res.session_id, SUM(res.num_seats) AS count
        FROM reservations res
        WHERE res.status IN ('confirmed', 'pending')
        GROUP BY res.session_id
      ) booked ON booked.session_id = s.id
      WHERE s.film_id = $1 AND s.start_time > NOW()
      ORDER BY s.start_time
    `, [id]);

    // Récupérer les avis approuvés
    const reviewsResult = await query(`
      SELECT r.id, r.rating, r.description, r.created_at,
             u.username, u.first_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      WHERE r.film_id = $1 AND r.status = 'approved'
      ORDER BY r.created_at DESC
      LIMIT 20
    `, [id]);

    res.json({
      ...filmResult.rows[0],
      sessions: sessionsResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer un nouveau film (admin/employé)
 * POST /api/films
 */
const createFilm = async (req, res, next) => {
  try {
    const { title, description, posterUrl, minAge, isCoupDeCoeur, genre, duration } = req.body;

    const result = await query(
      `INSERT INTO films (title, description, poster_url, min_age, is_coup_de_coeur, genre, duration, added_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       RETURNING *`,
      [title, description, posterUrl || null, minAge || 0, isCoupDeCoeur || false, genre, duration]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Modifier un film (admin/employé)
 * PUT /api/films/:id
 */
const updateFilm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, posterUrl, minAge, isCoupDeCoeur, genre, duration } = req.body;

    const result = await query(
      `UPDATE films SET title = $1, description = $2, poster_url = $3, min_age = $4,
       is_coup_de_coeur = $5, genre = $6, duration = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [title, description, posterUrl, minAge, isCoupDeCoeur, genre, duration, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un film (admin/employé)
 * DELETE /api/films/:id
 */
const deleteFilm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM films WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Film non trouvé' });
    }

    res.json({ message: 'Film supprimé avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer tous les genres disponibles
 * GET /api/films/genres
 */
const getGenres = async (req, res, next) => {
  try {
    const result = await query('SELECT DISTINCT genre FROM films WHERE genre IS NOT NULL ORDER BY genre');
    res.json(result.rows.map((r) => r.genre));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFilms, getLatestFilms, getFilmById, createFilm, updateFilm, deleteFilm, getGenres };
