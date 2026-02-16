import 'package:flutter/material.dart';
import '../models/reservation.dart';
import '../services/reservation_service.dart';

/// Provider des réservations
/// Gère la liste des réservations et le chargement
class ReservationProvider extends ChangeNotifier {
  final ReservationService _service = ReservationService();

  List<Reservation> _reservations = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Reservation> get reservations => _reservations;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Réservations du jour uniquement
  List<Reservation> get todayReservations {
    return _reservations.where((r) => r.isToday).toList();
  }

  /// Réservations futures (hors aujourd'hui)
  List<Reservation> get futureReservations {
    return _reservations.where((r) => r.isUpcoming && !r.isToday).toList();
  }

  /// Charger les réservations à venir depuis l'API
  Future<void> loadReservations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _reservations = await _service.getUpcomingReservations();
    } catch (e) {
      _error = 'Impossible de charger les réservations';
      _reservations = [];
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Rafraîchir les données
  Future<void> refresh() async {
    await loadReservations();
  }
}
