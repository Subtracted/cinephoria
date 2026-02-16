import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

/// Provider d'authentification
/// Gère l'état de connexion global de l'application
class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  User? _user;
  bool _isLoading = true;
  String? _error;

  // Getters
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  /// Initialisation : vérifie si un utilisateur est déjà connecté
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (isLoggedIn) {
        // Essayer de récupérer le profil depuis l'API
        try {
          _user = await _authService.getProfile();
        } catch (_) {
          // Si le token est expiré, on récupère les données locales
          _user = await _authService.getSavedUser();
        }
      }
    } catch (e) {
      _user = null;
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Connexion de l'utilisateur
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authService.login(email, password);
      _isLoading = false;
      notifyListeners();
      return true;
    } on DioException catch (e) {
      _error = e.response?.data?['error'] ?? 'Erreur de connexion';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Impossible de se connecter au serveur';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Déconnexion
  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    _error = null;
    notifyListeners();
  }

  /// Réinitialise l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
