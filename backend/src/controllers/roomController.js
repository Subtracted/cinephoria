const { query, getClient } = require('../config/db');

/**
 * Récupérer les salles d'un cinéma
 * GET /api/rooms?cinema=
 */
const getRooms = async (req, res, next) => {
  try {
    const { cinema } = req.query;

    let sql = `
      SELECT r.id, r.room_number, r.capacity, r.quality, r.is_accessible,
             c.id AS cinema_id, c.name AS cinema_name, c.city,
             qp.price
      FROM rooms r
      JOIN cinemas c ON c.id = r.cinema_id
      JOIN quality_prices qp ON qp.quality = r.quality
    `;

    const params = [];
    if (cinema) {
      sql += ' WHERE r.cinema_id = $1';
      params.push(cinema);
    }

    sql += ' ORDER BY c.name, r.room_number';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une salle par ID avec ses sièges
 * GET /api/rooms/:id
 */
const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const roomResult = await query(`
      SELECT r.id, r.room_number, r.capacity, r.quality, r.is_accessible,
             c.id AS cinema_id, c.name AS cinema_name
      FROM rooms r
      JOIN cinemas c ON c.id = r.cinema_id
      WHERE r.id = $1
    `, [id]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salle non trouvée' });
    }

    const seatsResult = await query(
      'SELECT id, seat_number, seat_row, is_pmr, is_available FROM seats WHERE room_id = $1 ORDER BY seat_row, seat_number',
      [id]
    );

    const incidentsResult = await query(`
      SELECT i.id, i.description, i.seat_number, i.status, i.created_at,
             u.first_name, u.last_name
      FROM incidents i
      JOIN users u ON u.id = i.employee_id
      WHERE i.room_id = $1 AND i.status != 'resolved'
      ORDER BY i.created_at DESC
    `, [id]);

    res.json({
      ...roomResult.rows[0],
      seats: seatsResult.rows,
      incidents: incidentsResult.rows,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Créer une salle (admin/employé)
 * POST /api/rooms
 */
const createRoom = async (req, res, next) => {
  const client = await getClient();

  try {
    const { cinemaId, roomNumber, capacity, quality } = req.body;

    await client.query('BEGIN');

    // Créer la salle
    const roomResult = await client.query(
      `INSERT INTO rooms (cinema_id, room_number, capacity, quality)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [cinemaId, roomNumber, capacity, quality]
    );

    const room = roomResult.rows[0];

    // Générer les sièges automatiquement
    const seatsPerRow = 10;
    const totalRows = Math.ceil(capacity / seatsPerRow);
    let currentSeat = 0;

    for (let i = 1; i <= totalRows; i++) {
      const rowLetter = String.fromCharCode(64 + i);
      for (let j = 1; j <= seatsPerRow; j++) {
        currentSeat++;
        if (currentSeat > capacity) break;

        await client.query(
          `INSERT INTO seats (room_id, seat_number, seat_row, is_pmr, is_available)
           VALUES ($1, $2, $3, $4, TRUE)`,
          [room.id, j, rowLetter, (i === totalRows && j <= 2)]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ message: 'Salle créée avec succès', room });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Modifier une salle (admin/employé)
 * PUT /api/rooms/:id
 */
const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roomNumber, capacity, quality } = req.body;

    const result = await query(
      `UPDATE rooms SET room_number = $1, capacity = $2, quality = $3
       WHERE id = $4 RETURNING *`,
      [roomNumber, capacity, quality, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salle non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

/**
 * Supprimer une salle (admin/employé)
 * DELETE /api/rooms/:id
 */
const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM rooms WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Salle non trouvée' });
    }

    res.json({ message: 'Salle supprimée avec succès' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getRooms, getRoomById, createRoom, updateRoom, deleteRoom };
