/// Configuration de l'API pour l'application mobile Cinéphoria
class ApiConfig {
  /// URL de base de l'API backend
  /// En développement : localhost avec le port du backend
  /// En production : URL du serveur déployé
  static const String baseUrl = 'http://10.0.2.2:5000/api'; // 10.0.2.2 = localhost pour émulateur Android

  /// URL pour iOS simulator
  static const String baseUrlIos = 'http://localhost:5000/api';

  /// Timeout des requêtes en millisecondes
  static const int connectTimeout = 10000;
  static const int receiveTimeout = 10000;

  /// Endpoints
  static const String login = '/auth/login';
  static const String profile = '/auth/me';
  static const String reservations = '/reservations/me';
  static const String reservationDetail = '/reservations'; // + /:id
}
