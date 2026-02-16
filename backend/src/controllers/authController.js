const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/email');
const { generatePassword } = require('../utils/generatePassword');

const SALT_ROUNDS = 10;

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // Vérifier si l'email existe déjà
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Créer l'utilisateur
    const result = await query(
      `INSERT INTO users (email, password, first_name, last_name, username, role, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'user', TRUE)
       RETURNING id, email, first_name, last_name, username, role`,
      [email, hashedPassword, firstName, lastName, username]
    );

    const user = result.rows[0];

    // Envoyer l'email de bienvenue
    sendWelcomeEmail(email, firstName);

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connexion d'un utilisateur
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const result = await query(
      'SELECT id, email, password, first_name, last_name, username, role, must_change_password FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        role: user.role,
        mustChangePassword: user.must_change_password,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, email, first_name, last_name, username, role, must_change_password, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      role: user.role,
      mustChangePassword: user.must_change_password,
      createdAt: user.created_at,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mot de passe oublié - Génère un nouveau mot de passe
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await query('SELECT id, first_name FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Ne pas révéler si l'email existe ou non (sécurité)
      return res.json({ message: 'Si cet email existe, un nouveau mot de passe a été envoyé' });
    }

    // Générer un nouveau mot de passe
    const newPassword = generatePassword(12);
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Mettre à jour en base avec obligation de changement
    await query(
      'UPDATE users SET password = $1, must_change_password = TRUE, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
      [hashedPassword, email]
    );

    // Envoyer par email
    sendPasswordResetEmail(email, newPassword);

    res.json({ message: 'Si cet email existe, un nouveau mot de passe a été envoyé' });
  } catch (error) {
    next(error);
  }
};

/**
 * Changer son mot de passe
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Récupérer le mot de passe actuel
    const result = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    // Vérifier l'ancien mot de passe
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher et mettre à jour
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await query(
      'UPDATE users SET password = $1, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, forgotPassword, changePassword };
