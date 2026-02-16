const { Pool } = require('pg');
require('dotenv').config();

// En production (Render), on utilise DATABASE_URL avec SSL
// En local, on utilise les variables individuelles
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'cinephoria',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

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
