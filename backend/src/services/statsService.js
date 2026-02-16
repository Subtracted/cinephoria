/**
 * Service de statistiques MongoDB
 *
 * POURQUOI MONGODB ICI ?
 * Les statistiques du dashboard sont des données dénormalisées, orientées lecture,
 * avec des agrégations temporelles (par jour, par film). MongoDB est pertinent car :
 * - Schéma flexible : on stocke un document par réservation avec toutes les infos agrégées
 * - Agrégation native : $group, $match, $sort sont optimisés pour ce type de requêtes
 * - Pas de jointures : chaque document contient film, cinéma, prix (dénormalisé)
 * - Performance en lecture : les pipelines d'agrégation sont plus rapides qu'un
 *   GROUP BY avec 5 JOINs sur PostgreSQL pour un dashboard temps réel
 * - Séparation des responsabilités : PostgreSQL = données transactionnelles,
 *   MongoDB = données analytiques (pattern CQRS simplifié)
 */

const { getDb, isMongoConnected } = require('../config/mongodb');

/**
 * Enregistre une stat de réservation dans MongoDB
 * Appelé après chaque réservation confirmée dans PostgreSQL
 * OPTIONNEL : ne fait rien si MongoDB n'est pas connecté
 * @param {Object} data - Données de la réservation
 */
const recordReservationStat = async (data) => {
  try {
    if (!isMongoConnected()) return; // MongoDB optionnel
    const db = getDb();
    const collection = db.collection('reservation_stats');

    await collection.insertOne({
      reservationId: data.reservationId,
      filmId: data.filmId,
      filmTitle: data.filmTitle,
      cinemaId: data.cinemaId,
      cinemaName: data.cinemaName,
      quality: data.quality,
      reservationCount: 1,
      seatCount: data.numSeats,
      revenue: data.totalPrice,
      date: new Date(),
    });
  } catch (error) {
    // Ne pas bloquer la réservation si MongoDB échoue
    console.error('[Stats] Erreur écriture MongoDB:', error.message);
  }
};

/**
 * Synchronise toutes les réservations PostgreSQL vers MongoDB
 * Utile pour initialiser ou reconstruire les stats
 */
const syncAllStats = async (pgQuery) => {
  try {
    if (!isMongoConnected()) {
      console.warn('[Stats] MongoDB non disponible, synchronisation ignorée');
      return 0;
    }
    const db = getDb();
    const collection = db.collection('reservation_stats');

    // Vider la collection
    await collection.deleteMany({});

    // Récupérer toutes les réservations confirmées depuis PostgreSQL
    const result = await pgQuery(`
      SELECT r.id AS reservation_id, r.total_price, r.num_seats, r.created_at,
             f.id AS film_id, f.title AS film_title,
             c.id AS cinema_id, c.name AS cinema_name,
             rm.quality
      FROM reservations r
      JOIN sessions s ON s.id = r.session_id
      JOIN films f ON f.id = s.film_id
      JOIN rooms rm ON rm.id = s.room_id
      JOIN cinemas c ON c.id = rm.cinema_id
      WHERE r.status = 'confirmed'
    `);

    if (result.rows.length === 0) return 0;

    const docs = result.rows.map((row) => ({
      reservationId: row.reservation_id,
      filmId: row.film_id,
      filmTitle: row.film_title,
      cinemaId: row.cinema_id,
      cinemaName: row.cinema_name,
      quality: row.quality,
      reservationCount: 1,
      seatCount: row.num_seats,
      revenue: parseFloat(row.total_price),
      date: new Date(row.created_at),
    }));

    await collection.insertMany(docs);
    console.log(`[Stats] ${docs.length} réservations synchronisées vers MongoDB`);
    return docs.length;
  } catch (error) {
    console.error('[Stats] Erreur synchronisation:', error.message);
    return 0;
  }
};

module.exports = { recordReservationStat, syncAllStats };
