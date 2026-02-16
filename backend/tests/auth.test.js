/**
 * Tests unitaires et fonctionnels - Authentification
 * Fonctionnalité testée : inscription, connexion, profil, mot de passe
 *
 * Ces tests vérifient :
 * - L'inscription d'un nouvel utilisateur (validation, création, doublon)
 * - La connexion (succès, mauvais identifiants)
 * - L'accès au profil (authentifié, non authentifié)
 * - La validation du mot de passe (règles de sécurité)
 * - Le changement de mot de passe
 * - Le mot de passe oublié
 */

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mock de la base de données PostgreSQL
jest.mock('../src/config/db', () => {
  const mockQuery = jest.fn();
  const mockGetClient = jest.fn();
  return {
    query: mockQuery,
    getClient: mockGetClient,
    pool: { on: jest.fn() },
  };
});

// Mock de MongoDB
jest.mock('../src/config/mongodb', () => ({
  connectMongo: jest.fn().mockResolvedValue({}),
  getDb: jest.fn().mockReturnValue({
    collection: jest.fn().mockReturnValue({
      aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    }),
  }),
  closeMongo: jest.fn(),
}));

// Mock de l'email
jest.mock('../src/utils/email', () => ({
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendContactEmail: jest.fn(),
}));

// Configuration de l'environnement de test
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.NODE_ENV = 'test';

const { query } = require('../src/config/db');

// Créer l'application Express sans démarrer le serveur
const express = require('express');
const app = express();
app.use(express.json());

// Importer les routes
const authRoutes = require('../src/routes/auth');
app.use('/api/auth', authRoutes);

// Gestion des erreurs
const { errorHandler } = require('../src/middleware/errorHandler');
app.use(errorHandler);

// ============================================
// TESTS UNITAIRES - Validation du mot de passe
// ============================================
describe('Tests unitaires - Validation du mot de passe', () => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

  test('accepte un mot de passe valide', () => {
    expect(passwordRegex.test('Admin@1234')).toBe(true);
    expect(passwordRegex.test('Str0ng#Pass')).toBe(true);
    expect(passwordRegex.test('MyP@ss123!')).toBe(true);
  });

  test('refuse un mot de passe sans majuscule', () => {
    expect(passwordRegex.test('admin@1234')).toBe(false);
  });

  test('refuse un mot de passe sans minuscule', () => {
    expect(passwordRegex.test('ADMIN@1234')).toBe(false);
  });

  test('refuse un mot de passe sans chiffre', () => {
    expect(passwordRegex.test('Admin@abcd')).toBe(false);
  });

  test('refuse un mot de passe sans caractère spécial', () => {
    expect(passwordRegex.test('Admin12345')).toBe(false);
  });

  test('refuse un mot de passe trop court (< 8 caractères)', () => {
    expect(passwordRegex.test('Ad@1')).toBe(false);
    expect(passwordRegex.test('Ab1@xyz')).toBe(false);
  });
});

// ============================================
// TESTS UNITAIRES - Génération de mot de passe
// ============================================
describe('Tests unitaires - Génération de mot de passe', () => {
  const { generatePassword } = require('../src/utils/generatePassword');

  test('génère un mot de passe de la longueur demandée', () => {
    const pwd = generatePassword(12);
    expect(pwd.length).toBe(12);
  });

  test('génère un mot de passe conforme aux exigences', () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])/;
    // Tester 20 mots de passe générés
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(12);
      expect(passwordRegex.test(pwd)).toBe(true);
    }
  });

  test('génère un mot de passe d\'au moins 8 caractères par défaut', () => {
    const pwd = generatePassword();
    expect(pwd.length).toBeGreaterThanOrEqual(8);
  });
});

// ============================================
// TESTS UNITAIRES - JWT
// ============================================
describe('Tests unitaires - JWT', () => {
  test('génère un token JWT valide', () => {
    const payload = { id: 1, email: 'test@test.fr', role: 'user' };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('test@test.fr');
    expect(decoded.role).toBe('user');
  });

  test('rejette un token expiré', () => {
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: '0s' });

    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
  });

  test('rejette un token avec une mauvaise clé', () => {
    const token = jwt.sign({ id: 1 }, 'wrong_secret');

    expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
  });
});

// ============================================
// TESTS FONCTIONNELS - Inscription (POST /api/auth/register)
// ============================================
describe('POST /api/auth/register - Inscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('crée un compte avec des données valides', async () => {
    // Mock : pas d'utilisateur existant
    query.mockResolvedValueOnce({ rows: [] });
    // Mock : insertion réussie
    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'nouveau@test.fr',
        first_name: 'Jean',
        last_name: 'Dupont',
        username: 'jdupont',
        role: 'user',
      }],
    });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'nouveau@test.fr',
        password: 'Test@1234',
        firstName: 'Jean',
        lastName: 'Dupont',
        username: 'jdupont',
      });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('nouveau@test.fr');
    expect(response.body.user.role).toBe('user');
    expect(response.body.message).toBe('Compte créé avec succès');
  });

  test('refuse une inscription avec un email déjà existant', async () => {
    // Mock : utilisateur existant
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'existant@test.fr',
        password: 'Test@1234',
        firstName: 'Jean',
        lastName: 'Dupont',
        username: 'jdupont',
      });

    expect(response.status).toBe(409);
    expect(response.body.error).toContain('existe déjà');
  });

  test('refuse une inscription sans champs requis', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.fr' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Champs requis manquants');
    expect(response.body.fields).toContain('password');
    expect(response.body.fields).toContain('firstName');
  });

  test('refuse une inscription avec un email invalide', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'pas-un-email',
        password: 'Test@1234',
        firstName: 'Jean',
        lastName: 'Dupont',
        username: 'jdupont',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('email invalide');
  });

  test('refuse une inscription avec un mot de passe faible', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.fr',
        password: 'faible',
        firstName: 'Jean',
        lastName: 'Dupont',
        username: 'jdupont',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('mot de passe');
  });
});

// ============================================
// TESTS FONCTIONNELS - Connexion (POST /api/auth/login)
// ============================================
describe('POST /api/auth/login - Connexion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('connecte un utilisateur avec des identifiants valides', async () => {
    const hashedPassword = await bcrypt.hash('Test@1234', 10);

    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'user@test.fr',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user',
        must_change_password: false,
      }],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.fr', password: 'Test@1234' });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('user@test.fr');
    expect(response.body.message).toBe('Connexion réussie');
  });

  test('refuse la connexion avec un mauvais mot de passe', async () => {
    const hashedPassword = await bcrypt.hash('Test@1234', 10);

    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'user@test.fr',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user',
        must_change_password: false,
      }],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.fr', password: 'MauvaisMotDePasse@1' });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('incorrect');
  });

  test('refuse la connexion avec un email inexistant', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistant@test.fr', password: 'Test@1234' });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('incorrect');
  });

  test('refuse la connexion sans champs requis', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Champs requis manquants');
  });

  test('signale si le changement de mot de passe est obligatoire', async () => {
    const hashedPassword = await bcrypt.hash('Temp@1234', 10);

    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'user@test.fr',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user',
        must_change_password: true,
      }],
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.fr', password: 'Temp@1234' });

    expect(response.status).toBe(200);
    expect(response.body.user.mustChangePassword).toBe(true);
  });
});

// ============================================
// TESTS FONCTIONNELS - Profil (GET /api/auth/me)
// ============================================
describe('GET /api/auth/me - Profil', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retourne le profil avec un token valide', async () => {
    const token = jwt.sign(
      { id: 1, email: 'user@test.fr', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    query.mockResolvedValueOnce({
      rows: [{
        id: 1,
        email: 'user@test.fr',
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        role: 'user',
        must_change_password: false,
        created_at: new Date().toISOString(),
      }],
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('user@test.fr');
    expect(response.body.firstName).toBe('Test');
  });

  test('refuse l\'accès sans token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Token');
  });

  test('refuse l\'accès avec un token invalide', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token_invalide');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('invalide');
  });
});

// ============================================
// TESTS FONCTIONNELS - Mot de passe oublié (POST /api/auth/forgot-password)
// ============================================
describe('POST /api/auth/forgot-password - Mot de passe oublié', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('traite la demande pour un email existant', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 1, first_name: 'Test' }] });
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // UPDATE

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'user@test.fr' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('mot de passe');
  });

  test('ne révèle pas si l\'email n\'existe pas (sécurité)', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'inexistant@test.fr' });

    expect(response.status).toBe(200);
    // Même message que si l'email existait
    expect(response.body.message).toContain('mot de passe');
  });
});

// ============================================
// TESTS FONCTIONNELS - Changement de mot de passe
// ============================================
describe('PUT /api/auth/change-password - Changement de mot de passe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('change le mot de passe avec l\'ancien mot de passe correct', async () => {
    const currentHash = await bcrypt.hash('Old@1234', 10);
    const token = jwt.sign(
      { id: 1, email: 'user@test.fr', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    query.mockResolvedValueOnce({ rows: [{ password: currentHash }] });
    query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // UPDATE

    const response = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Old@1234',
        newPassword: 'New@5678',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('modifié');
  });

  test('refuse le changement avec un mauvais ancien mot de passe', async () => {
    const currentHash = await bcrypt.hash('Old@1234', 10);
    const token = jwt.sign(
      { id: 1, email: 'user@test.fr', role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    query.mockResolvedValueOnce({ rows: [{ password: currentHash }] });

    const response = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Mauvais@1234',
        newPassword: 'New@5678',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('incorrect');
  });
});
