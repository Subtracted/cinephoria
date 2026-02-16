import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

/// Service centralisé pour les appels API
/// Gère l'authentification JWT, les intercepteurs et les erreurs
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(milliseconds: ApiConfig.connectTimeout),
      receiveTimeout: const Duration(milliseconds: ApiConfig.receiveTimeout),
      headers: {'Content-Type': 'application/json'},
    ));

    // Intercepteur pour ajouter le token JWT automatiquement
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          // Token expiré, on supprime le token
          clearToken();
        }
        return handler.next(error);
      },
    ));
  }

  /// Getter pour l'instance Dio
  Dio get dio => _dio;

  // =====================
  // Gestion du token
  // =====================

  /// Sauvegarder le token JWT de manière sécurisée
  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  /// Récupérer le token stocké
  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  /// Supprimer le token (déconnexion)
  Future<void> clearToken() async {
    await _storage.delete(key: 'jwt_token');
  }

  /// Sauvegarder les données utilisateur
  Future<void> saveUserData(String userData) async {
    await _storage.write(key: 'user_data', value: userData);
  }

  /// Récupérer les données utilisateur
  Future<String?> getUserData() async {
    return await _storage.read(key: 'user_data');
  }

  /// Supprimer toutes les données stockées
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  // =====================
  // Méthodes HTTP
  // =====================

  /// GET request
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  /// POST request
  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  /// PUT request
  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  /// DELETE request
  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}
