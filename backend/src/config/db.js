const { Pool } = require('pg');
require('dotenv').config();

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cinephoria',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('[PostgreSQL] Connexion établie');
});

pool.on('error', (err) => {
  console.error('[PostgreSQL] Erreur de connexion :', err.message);
  process.exit(-1);
});

/**
 * Exécute une requête SQL avec des paramètres
 * @param {string} text - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise} Résultat de la requête
 */
const query = (text, params) => pool.query(text, params);

/**
 * Obtient un client du pool pour les transactions
 * @returns {Promise} Client PostgreSQL
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
