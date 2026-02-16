const { query } = require('../config/db');

/**
 * Créer un incident (employé)
 * POST /api/incidents
 */
const createIncident = async (req, res, next) => {
  try {
    const { roomId, description, seatNumber } = req.body;
    const employeeId = req.user.id;

    const result = await query(
      `INSERT INTO incidents (employee_id, room_id, description, seat_number, status)
       VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
      [employeeId, roomId, description, seatNumber || null]
    );

    res.status(201).json({
      message: 'Incident signalé avec succès',
      incident: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les incidents (employé)
 * GET /api/incidents?room=&status=
 */
const getIncidents = async (req, res, next) => {
  try {
    const { room, status } = req.query;

    let sql = `
      SELECT i.id, i.description, i.seat_number, i.status, i.created_at, i.updated_at,
             r.room_number, r.quality,
             c.name AS cinema_name, c.city,
             u.first_name || ' ' || u.last_name AS reported_by
      FROM incidents i
      JOIN rooms r ON r.id = i.room_id
      JOIN cinemas c ON c.id = r.cinema_id
      JOIN users u ON u.id = i.employee_id
    `;

    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (room) {
      conditions.push(`i.room_id = $${paramIndex++}`);
      params.push(room);
    }

    if (status) {
      conditions.push(`i.status = $${paramIndex++}`);
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY i.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le statut d'un incident
 * PUT /api/incidents/:id
 */
const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, description } = req.body;

    const result = await query(
      `UPDATE incidents SET status = COALESCE($1, status), description = COALESCE($2, description),
       updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [status, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { createIncident, getIncidents, updateIncident };
