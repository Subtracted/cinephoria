const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cinephoria';
const DB_NAME = 'cinephoria';

let db = null;
let client = null;

/**
 * Connexion à MongoDB
 * Utilisé pour le dashboard statistiques (base NoSQL)
 * OPTIONNEL : le serveur fonctionne sans MongoDB (seul le dashboard sera indisponible)
 */
const connectMongo = async () => {
  try {
    client = new MongoClient(MONGO_URI, {
      serverSelectionTimeoutMS: 3000, // Timeout rapide si MongoDB absent
    });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('[MongoDB] Connexion établie');
    return db;
  } catch (error) {
    console.warn('[MongoDB] Non disponible :', error.message);
    console.warn('[MongoDB] Le serveur continue sans MongoDB (dashboard indisponible)');
    db = null;
    client = null;
    // Ne PAS faire process.exit — MongoDB est optionnel
  }
};

/**
 * Récupère l'instance de la base MongoDB
 * Retourne null si MongoDB n'est pas connecté (optionnel)
 */
const getDb = () => {
  return db; // null si non connecté
};

/**
 * Vérifie si MongoDB est disponible
 */
const isMongoConnected = () => {
  return db !== null;
};

/**
 * Ferme la connexion MongoDB
 */
const closeMongo = async () => {
  if (client) {
    await client.close();
    console.log('[MongoDB] Connexion fermée');
  }
};

module.exports = { connectMongo, getDb, isMongoConnected, closeMongo };
