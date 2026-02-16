/// Modèle de réservation pour l'application mobile Cinéphoria
class Reservation {
  final int id;
  final double totalPrice;
  final int numSeats;
  final String status;
  final DateTime createdAt;
  final DateTime startTime;
  final DateTime endTime;
  final int filmId;
  final String filmTitle;
  final String? posterUrl;
  final int roomNumber;
  final String quality;
  final String cinemaName;
  final String city;
  final List<SeatInfo> seats;

  Reservation({
    required this.id,
    required this.totalPrice,
    required this.numSeats,
    required this.status,
    required this.createdAt,
    required this.startTime,
    required this.endTime,
    required this.filmId,
    required this.filmTitle,
    this.posterUrl,
    required this.roomNumber,
    required this.quality,
    required this.cinemaName,
    required this.city,
    required this.seats,
  });

  /// Création depuis la réponse JSON de l'API
  factory Reservation.fromJson(Map<String, dynamic> json) {
    return Reservation(
      id: json['id'],
      totalPrice: double.tryParse(json['total_price'].toString()) ?? 0.0,
      numSeats: json['num_seats'] ?? 1,
      status: json['status'] ?? 'confirmed',
      createdAt: DateTime.parse(json['created_at']),
      startTime: DateTime.parse(json['start_time']),
      endTime: DateTime.parse(json['end_time']),
      filmId: json['film_id'],
      filmTitle: json['film_title'] ?? 'Film inconnu',
      posterUrl: json['poster_url'],
      roomNumber: json['room_number'] ?? 0,
      quality: json['quality'] ?? 'Standard',
      cinemaName: json['cinema_name'] ?? '',
      city: json['city'] ?? '',
      seats: (json['seats'] as List<dynamic>?)
              ?.map((s) => SeatInfo.fromJson(s))
              .toList() ??
          [],
    );
  }

  /// Vérifie si la séance est aujourd'hui ou dans le futur
  bool get isUpcoming => startTime.isAfter(DateTime.now());

  /// Vérifie si c'est aujourd'hui
  bool get isToday {
    final now = DateTime.now();
    return startTime.year == now.year &&
        startTime.month == now.month &&
        startTime.day == now.day;
  }

  /// Texte des places formaté
  String get seatsText {
    return seats.map((s) => '${s.seatRow}${s.seatNumber}').join(', ');
  }

  /// Statut en français
  String get statusLabel {
    switch (status) {
      case 'confirmed':
        return 'Confirmée';
      case 'cancelled':
        return 'Annulée';
      case 'used':
        return 'Utilisée';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  }
}

/// Information d'un siège réservé
class SeatInfo {
  final String seatRow;
  final int seatNumber;

  SeatInfo({required this.seatRow, required this.seatNumber});

  factory SeatInfo.fromJson(Map<String, dynamic> json) {
    return SeatInfo(
      seatRow: json['seatRow'] ?? '',
      seatNumber: json['seatNumber'] ?? 0,
    );
  }
}

/// Modèle détaillé pour le scan QR (employé)
class ReservationDetail {
  final int id;
  final String filmTitle;
  final String? posterUrl;
  final DateTime startTime;
  final DateTime endTime;
  final int roomNumber;
  final String quality;
  final String cinemaName;
  final String city;
  final int numSeats;
  final double totalPrice;
  final String status;
  final String firstName;
  final String lastName;
  final List<SeatInfo> seats;

  ReservationDetail({
    required this.id,
    required this.filmTitle,
    this.posterUrl,
    required this.startTime,
    required this.endTime,
    required this.roomNumber,
    required this.quality,
    required this.cinemaName,
    required this.city,
    required this.numSeats,
    required this.totalPrice,
    required this.status,
    required this.firstName,
    required this.lastName,
    required this.seats,
  });

  factory ReservationDetail.fromJson(Map<String, dynamic> json) {
    return ReservationDetail(
      id: json['id'],
      filmTitle: json['film_title'] ?? '',
      posterUrl: json['poster_url'],
      startTime: DateTime.parse(json['start_time']),
      endTime: DateTime.parse(json['end_time']),
      roomNumber: json['room_number'] ?? 0,
      quality: json['quality'] ?? '',
      cinemaName: json['cinema_name'] ?? '',
      city: json['city'] ?? '',
      numSeats: json['num_seats'] ?? 1,
      totalPrice: double.tryParse(json['total_price'].toString()) ?? 0.0,
      status: json['status'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      seats: (json['seats'] as List<dynamic>?)
              ?.map((s) => SeatInfo.fromJson(s))
              .toList() ??
          [],
    );
  }

  String get clientName => '$firstName $lastName';
  String get seatsText => seats.map((s) => '${s.seatRow}${s.seatNumber}').join(', ');
}
