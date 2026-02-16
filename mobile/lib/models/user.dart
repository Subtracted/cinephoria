/// Modèle utilisateur pour l'application mobile Cinéphoria
class User {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String username;
  final String role;
  final bool mustChangePassword;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.username,
    required this.role,
    this.mustChangePassword = false,
  });

  /// Création depuis la réponse JSON de l'API
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      username: json['username'] ?? '',
      role: json['role'] ?? 'user',
      mustChangePassword: json['mustChangePassword'] ?? false,
    );
  }

  /// Conversion en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'username': username,
      'role': role,
      'mustChangePassword': mustChangePassword,
    };
  }

  /// Nom complet
  String get fullName => '$firstName $lastName';
}
