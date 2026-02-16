const { query, getClient } = require('../config/db');
const { recordReservationStat } = require('../services/statsService');

/**
 * Créer une réservation (transaction sécurisée anti-surbooking)
 * POST /api/reservations
 *
 * Sécurité de la transaction :
 * 1. FOR UPDATE sur la séance → sérialise les réservations concurrentes
 * 2. FOR UPDATE sur les sièges → verrouille les lignes pour empêcher toute modification
 * 3. Vérification disponibilité en base (reservation_seats + seats.is_available)
 * 4. INSERT réservation + INSERT reservation_seats dans la même transaction
 * 5. COMMIT atomique ou ROLLBACK complet en cas d'erreur
 */
const createReservation = async (req, res, next) => {
  const client = await getClient();

  try {
    const { sessionId, seatIds } = req.body;
    const userId = req.user.id;

    // Validation des entrées
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'Vous devez sélectionner au moins un siège' });
    }

    if (seatIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      return res.status(400).json({ error: 'Identifiants de sièges invalides' });
    }

    // ============================================
    // BEGIN TRANSACTION
    // ============================================
    await client.query('BEGIN');

    // Niveau d'isolation SERIALIZABLE pour protection maximale anti-surbooking
    await client.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');

    // ──────────────────────────────────────────
    // ÉTAPE 1 : Verrouiller la séance (FOR UPDATE)
    // Empêche toute réservation concurrente sur la même séance
    // ──────────────────────────────────────────
    const sessionResult = await client.query(`
      SELECT s.id, s.start_time, s.end_time, s.room_id,
             rm.quality, rm.capacity,
             qp.price,
             f.id AS film_id, f.title AS film_title,
             c.id AS cinema_id, c.name AS cinema_name
      FROM sessions s
      JOIN rooms rm ON rm.id = s.room_id
      JOIN quality_prices qp ON qp.quality = rm.quality
      JOIN films f ON f.id = s.film_id
      JOIN cinemas c ON c.id = rm.cinema_id
      WHERE s.id = $1 AND s.start_time > NOW()
      FOR UPDATE OF s
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Séance non trouvée ou déjà passée' });
    }

    const session = sessionResult.rows[0];
    const numSeats = seatIds.length;
    const totalPrice = parseFloat(session.price) * numSeats;

    // ──────────────────────────────────────────
    // ÉTAPE 2 : Verrouiller ET vérifier les sièges (FOR UPDATE)
    // Verrouillage pessimiste sur chaque siège demandé
    // ──────────────────────────────────────────
    const seatsResult = await client.query(`
      SELECT s.id, s.seat_row, s.seat_number, s.is_pmr, s.is_available
      FROM seats s
      WHERE s.id = ANY($1::int[])
        AND s.room_id = $2
      FOR UPDATE OF s
    `, [seatIds, session.room_id]);

    // Vérifier que tous les sièges demandés existent dans la bonne salle
    if (seatsResult.rows.length !== numSeats) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Un ou plusieurs sièges sont invalides pour cette salle',
        found: seatsResult.rows.length,
        requested: numSeats,
      });
    }

    // Vérifier que tous les sièges sont physiquement disponibles
    const unavailableSeats = seatsResult.rows.filter((s) => !s.is_available);
    if (unavailableSeats.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Certains sièges sont hors service',
        unavailable: unavailableSeats.map((s) => `${s.seat_row}${s.seat_number}`),
      });
    }

    // Vérifier qu'aucun siège n'est déjà réservé pour cette séance
    const alreadyBookedResult = await client.query(`
      SELECT rs.seat_id
      FROM reservation_seats rs
      JOIN reservations r ON r.id = rs.reservation_id
      WHERE r.session_id = $1
        AND r.status IN ('confirmed', 'pending')
        AND rs.seat_id = ANY($2::int[])
    `, [sessionId, seatIds]);

    if (alreadyBookedResult.rows.length > 0) {
      await client.query('ROLLBACK');
      const bookedIds = alreadyBookedResult.rows.map((r) => r.seat_id);
      const bookedLabels = seatsResult.rows
        .filter((s) => bookedIds.includes(s.id))
        .map((s) => `${s.seat_row}${s.seat_number}`);
      return res.status(409).json({
        error: 'Un ou plusieurs sièges sont déjà réservés',
        alreadyBooked: bookedLabels,
      });
    }

    // Vérifier la capacité globale de la salle pour cette séance
    const capacityResult = await client.query(`
      SELECT COALESCE(SUM(r.num_seats), 0) AS booked
      FROM reservations r
      WHERE r.session_id = $1 AND r.status IN ('confirmed', 'pending')
    `, [sessionId]);

    const currentBooked = parseInt(capacityResult.rows[0].booked);
    if (currentBooked + numSeats > session.capacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Capacité de la salle insuffisante',
        available: session.capacity - currentBooked,
        requested: numSeats,
      });
    }

    // ──────────────────────────────────────────
    // ÉTAPE 3 : INSERT réservation
    // ──────────────────────────────────────────
    const reservationResult = await client.query(
      `INSERT INTO reservations (user_id, session_id, total_price, num_seats, status)
       VALUES ($1, $2, $3, $4, 'confirmed') RETURNING *`,
      [userId, sessionId, totalPrice, numSeats]
    );

    const reservation = reservationResult.rows[0];

    // ──────────────────────────────────────────
    // ÉTAPE 4 : INSERT sièges réservés (liaison)
    // ──────────────────────────────────────────
    for (const seatId of seatIds) {
      await client.query(
        'INSERT INTO reservation_seats (reservation_id, seat_id) VALUES ($1, $2)',
        [reservation.id, seatId]
      );
    }

    // ============================================
    // COMMIT - Tout a réussi, on valide
    // ============================================
    await client.query('COMMIT');

    // ──────────────────────────────────────────
    // ÉTAPE 5 : Enregistrer les stats dans MongoDB (post-commit, non bloquant)
    // Si MongoDB échoue, la réservation PostgreSQL reste valide
    // ──────────────────────────────────────────
    recordReservationStat({
      reservationId: reservation.id,
      filmId: session.film_id,
      filmTitle: session.film_title,
      cinemaId: session.cinema_id,
      cinemaName: session.cinema_name,
      quality: session.quality,
      numSeats,
      totalPrice,
    });

    res.status(201).json({
      message: 'Réservation confirmée',
      reservation: {
        id: reservation.id,
        sessionId: reservation.session_id,
        totalPrice: reservation.total_price,
        numSeats: reservation.num_seats,
        status: reservation.status,
        createdAt: reservation.created_at,
      },
    });
  } catch (error) {
    // ============================================
    // ROLLBACK - Erreur, rien n'est modifié
    // ============================================
    await client.query('ROLLBACK');

    // Gestion spécifique erreur de sérialisation (concurrence)
    if (error.code === '40001') {
      return res.status(409).json({
        error: 'Conflit de réservation, veuillez réessayer',
      });
    }

    next(error);
  } finally {
    client.release();
  }
};

/**
 * Récupérer les réservations de l'utilisateur connecté
 * GET /api/reservations/me
 */
const getMyReservations = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT res.id, res.total_price, res.num_seats, res.status, res.created_at,
             s.start_time, s.end_time,
             f.id AS film_id, f.title AS film_title, f.poster_url,
             rm.room_number, rm.quality,
             c.name AS cinema_name, c.city,
             json_agg(json_build_object(
               'seatId', st.id, 'seatRow', st.seat_row, 'seatNumber', st.seat_number
             )) AS seats
      FROM reservations res
      JOIN sessions s ON s.id = res.session_id
      JOIN films f ON f.id = s.film_id
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      JOIN reservation_seats rs ON rs.reservation_id = res.id
      JOIN seats st ON st.id = rs.seat_id
      WHERE res.user_id = $1
      GROUP BY res.id, s.start_time, s.end_time, f.id, f.title, f.poster_url,
               rm.room_number, rm.quality, c.name, c.city
      ORDER BY s.start_time DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Annuler une réservation
 * PUT /api/reservations/:id/cancel
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(
      `UPDATE reservations SET status = 'cancelled'
       WHERE id = $1 AND user_id = $2 AND status = 'confirmed'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée ou non annulable' });
    }

    res.json({ message: 'Réservation annulée avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une réservation par ID (pour QR code)
 * GET /api/reservations/:id
 */
const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT res.id, res.total_price, res.num_seats, res.status, res.created_at,
             res.user_id,
             s.start_time, s.end_time,
             f.title AS film_title, f.poster_url,
             rm.room_number, rm.quality,
             c.name AS cinema_name, c.city,
             json_agg(json_build_object(
               'seatRow', st.seat_row, 'seatNumber', st.seat_number
             )) AS seats,
             u.first_name, u.last_name
      FROM reservations res
      JOIN sessions s ON s.id = res.session_id
      JOIN films f ON f.id = s.film_id
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      JOIN reservation_seats rs ON rs.reservation_id = res.id
      JOIN seats st ON st.id = rs.seat_id
      JOIN users u ON u.id = res.user_id
      WHERE res.id = $1
      GROUP BY res.id, s.start_time, s.end_time, f.title, f.poster_url,
               rm.room_number, rm.quality, c.name, c.city, u.first_name, u.last_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Réservation non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { createReservation, getMyReservations, cancelReservation, getReservationById };
