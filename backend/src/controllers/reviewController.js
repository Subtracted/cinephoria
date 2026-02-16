const { query } = require('../config/db');

/**
 * Créer un avis sur un film (utilisateur)
 * POST /api/reviews
 */
const createReview = async (req, res, next) => {
  try {
    const { filmId, reservationId, rating, description } = req.body;
    const userId = req.user.id;

    // Vérifier que l'utilisateur a bien une réservation passée pour ce film
    const reservationCheck = await query(`
      SELECT res.id FROM reservations res
      JOIN sessions s ON s.id = res.session_id
      WHERE res.id = $1 AND res.user_id = $2 AND s.film_id = $3
        AND s.end_time < NOW() AND res.status = 'confirmed'
    `, [reservationId, userId, filmId]);

    if (reservationCheck.rows.length === 0) {
      return res.status(403).json({
        error: 'Vous ne pouvez noter que les films de vos séances passées',
      });
    }

    // Vérifier qu'il n'a pas déjà noté ce film
    const existing = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND film_id = $2',
      [userId, filmId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Vous avez déjà noté ce film' });
    }

    const result = await query(
      `INSERT INTO reviews (user_id, film_id, reservation_id, rating, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [userId, filmId, reservationId, rating, description]
    );

    res.status(201).json({
      message: 'Avis soumis, en attente de validation',
      review: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les avis en attente (employé)
 * GET /api/reviews/pending
 */
const getPendingReviews = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT r.id, r.rating, r.description, r.created_at,
             u.username, u.first_name, u.last_name,
             f.title AS film_title, f.id AS film_id
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN films f ON f.id = r.film_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Valider ou rejeter un avis (employé)
 * PUT /api/reviews/:id/moderate
 */
const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' ou 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide (approved ou rejected)' });
    }

    const result = await query(
      'UPDATE reviews SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }

    res.json({ message: `Avis ${status === 'approved' ? 'approuvé' : 'rejeté'}` });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer un avis (employé)
 * DELETE /api/reviews/:id
 */
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM reviews WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avis non trouvé' });
    }

    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getPendingReviews, moderateReview, deleteReview };
