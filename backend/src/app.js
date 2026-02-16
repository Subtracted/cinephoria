const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { errorHandler, notFound } = require('./middleware/errorHandler');
const { connectMongo } = require('./config/mongodb');

// Import des routes
const authRoutes = require('./routes/auth');
const cinemaRoutes = require('./routes/cinemas');
const filmRoutes = require('./routes/films');
const sessionRoutes = require('./routes/sessions');
const reservationRoutes = require('./routes/reservations');
const reviewRoutes = require('./routes/reviews');
const roomRoutes = require('./routes/rooms');
const contactRoutes = require('./routes/contacts');
const incidentRoutes = require('./routes/incidents');
const adminRoutes = require('./routes/admin');
const qualityPriceRoutes = require('./routes/qualityPrices');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middlewares globaux
// ============================================
app.use(helmet()); // Sécurité headers HTTP
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev')); // Logs HTTP
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (affiches films, etc.)
app.use('/images', express.static('public/images'));

// ============================================
// Routes API
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/cinemas', cinemaRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/quality-prices', qualityPriceRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================
// Gestion des erreurs
// ============================================
app.use(notFound);
app.use(errorHandler);

// ============================================
// Démarrage du serveur
// ============================================
const startServer = async () => {
  try {
    // Connexion MongoDB (optionnel, le serveur démarre même si MongoDB n'est pas disponible)
    try {
      await connectMongo();
    } catch (err) {
      console.warn('[MongoDB] Connexion échouée, le dashboard sera indisponible:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`\n🎬 Serveur Cinéphoria démarré sur http://localhost:${PORT}`);
      console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
