import '../config/api_config.dart';
import '../models/reservation.dart';
import 'api_service.dart';

/// Service de gestion des réservations
/// Récupère les réservations de l'utilisateur connecté
class ReservationService {
  final ApiService _api = ApiService();

  /// Récupère toutes les réservations de l'utilisateur
  Future<List<Reservation>> getMyReservations() async {
    try {
      final response = await _api.get(ApiConfig.reservations);
      final List<dynamic> data = response.data;
      return data.map((json) => Reservation.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  /// Récupère les réservations du jour et futures (séances à venir)
  Future<List<Reservation>> getUpcomingReservations() async {
    final all = await getMyReservations();
    return all
        .where((r) =>
            r.status == 'confirmed' &&
            r.startTime.isAfter(DateTime.now().subtract(const Duration(hours: 2))))
        .toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  /// Récupère le détail d'une réservation (pour le QR code / scan employé)
  Future<ReservationDetail> getReservationDetail(int id) async {
    try {
      final response = await _api.get('${ApiConfig.reservationDetail}/$id');
      return ReservationDetail.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
