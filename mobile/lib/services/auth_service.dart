import 'dart:convert';
import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';

/// Service d'authentification
/// Gère la connexion, la déconnexion et la persistance de session
class AuthService {
  final ApiService _api = ApiService();

  /// Connexion avec email et mot de passe
  /// Retourne l'utilisateur connecté ou lève une exception
  Future<User> login(String email, String password) async {
    try {
      final response = await _api.post(
        ApiConfig.login,
        data: {'email': email, 'password': password},
      );

      final data = response.data;
      final user = User.fromJson(data['user']);

      // Sauvegarder le token et les données utilisateur
      await _api.saveToken(data['token']);
      await _api.saveUserData(jsonEncode(data['user']));

      return user;
    } catch (e) {
      rethrow;
    }
  }

  /// Déconnexion : supprime le token et les données
  Future<void> logout() async {
    await _api.clearAll();
  }

  /// Vérifie si un utilisateur est connecté (token présent)
  Future<bool> isLoggedIn() async {
    final token = await _api.getToken();
    return token != null && token.isNotEmpty;
  }

  /// Récupère l'utilisateur sauvegardé localement
  Future<User?> getSavedUser() async {
    try {
      final userData = await _api.getUserData();
      if (userData != null) {
        return User.fromJson(jsonDecode(userData));
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Récupère le profil depuis l'API (vérifie que le token est valide)
  Future<User> getProfile() async {
    try {
      final response = await _api.get(ApiConfig.profile);
      return User.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
