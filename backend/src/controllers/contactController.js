const { query } = require('../config/db');
const { sendContactEmail } = require('../utils/email');

/**
 * Envoyer un message de contact
 * POST /api/contacts
 */
const sendContact = async (req, res, next) => {
  try {
    const { username, title, description, email } = req.body;

    // Enregistrer en base
    const result = await query(
      `INSERT INTO contacts (username, title, description, email)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [username || null, title, description, email || null]
    );

    // Envoyer l'email
    sendContactEmail({ username, title, description, email });

    res.status(201).json({
      message: 'Votre message a bien été envoyé',
      contact: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendContact };
