const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { getDb } = require('../config/mongodb');
const { syncAllStats } = require('../services/statsService');

const SALT_ROUNDS = 10;

/**
 * Créer un compte employé (admin)
 * POST /api/admin/employees
 */
const createEmployee = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username, cinemaId } = req.body;

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, username, role, cinema_id, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'employee', $6, TRUE)
       RETURNING id, email, first_name, last_name, username, role, cinema_id`,
      [email, hashedPassword, firstName, lastName, username, cinemaId]
    );

    res.status(201).json({
      message: 'Compte employé créé avec succès',
      employee: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réinitialiser le mot de passe d'un employé (admin)
 * PUT /api/admin/employees/:id/reset-password
 */
const resetEmployeePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await query(
      `UPDATE users SET password = $1, must_change_password = TRUE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND role = 'employee' RETURNING id, email`,
      [hashedPassword, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employé non trouvé' });
    }

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le dashboard statistiques (données MongoDB)
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res, next) => {
  try {
    const db = getDb();
    const statsCollection = db.collection('reservation_stats');

    // Période de 7 jours
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Réservations par film sur 7 jours
    const reservationsByFilm = await statsCollection.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: '$filmTitle',
          totalReservations: { $sum: '$reservationCount' },
          totalSeats: { $sum: '$seatCount' },
          totalRevenue: { $sum: '$revenue' },
        },
      },
      { $sort: { totalReservations: -1 } },
    ]).toArray();

    // Réservations par jour
    const reservationsByDay = await statsCollection.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalReservations: { $sum: '$reservationCount' },
          totalRevenue: { $sum: '$revenue' },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    res.json({
      period: '7 jours',
      reservationsByFilm,
      reservationsByDay,
    });
  } catch (error) {
    // Si MongoDB n'est pas disponible, renvoyer des données vides
    console.error('[Dashboard] Erreur MongoDB:', error.message);
    res.json({
      period: '7 jours',
      reservationsByFilm: [],
      reservationsByDay: [],
      warning: 'Les données statistiques sont temporairement indisponibles',
    });
  }
};

/**
 * Récupérer la liste des employés (admin)
 * GET /api/admin/employees
 */
const getEmployees = async (req, res, next) => {
  try {
    const result = await query(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.username, u.role,
             u.created_at, c.name AS cinema_name, c.city
      FROM users u
      LEFT JOIN cinemas c ON c.id = u.cinema_id
      WHERE u.role = 'employee'
      ORDER BY u.last_name
    `);

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Synchroniser les stats PostgreSQL → MongoDB (admin)
 * POST /api/admin/sync-stats
 */
const syncStats = async (req, res, next) => {
  try {
    const count = await syncAllStats(query);
    res.json({ message: `${count} réservations synchronisées vers MongoDB` });
  } catch (error) {
    next(error);
  }
};

module.exports = { createEmployee, resetEmployeePassword, getDashboard, getEmployees, syncStats };
