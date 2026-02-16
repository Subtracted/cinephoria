import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../config/theme.dart';
import '../models/reservation.dart';
import '../services/reservation_service.dart';

/// Écran QR Code (US 14)
/// Affiche le QR code du billet pour une réservation donnée
/// Le QR contient les informations nécessaires au scan par l'employé
class QrCodeScreen extends StatefulWidget {
  final int reservationId;

  const QrCodeScreen({super.key, required this.reservationId});

  @override
  State<QrCodeScreen> createState() => _QrCodeScreenState();
}

class _QrCodeScreenState extends State<QrCodeScreen> {
  final ReservationService _service = ReservationService();
  ReservationDetail? _detail;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    try {
      final detail = await _service.getReservationDetail(widget.reservationId);
      setState(() {
        _detail = detail;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Impossible de charger les détails';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon billet'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primaryGreen),
            )
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
                      const SizedBox(height: 12),
                      Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                    ],
                  ),
                )
              : _buildTicket(),
    );
  }

  Widget _buildTicket() {
    final detail = _detail!;
    final dateFormat = DateFormat('EEEE d MMMM yyyy', 'fr_FR');
    final timeFormat = DateFormat('HH:mm', 'fr_FR');

    // Données encodées dans le QR code (JSON simplifié pour le scan employé)
    final qrData =
        '{"reservationId":${detail.id},"film":"${detail.filmTitle}","seats":${detail.numSeats},"client":"${detail.clientName}","date":"${detail.startTime.toIso8601String()}"}';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          // Carte du billet
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: AppTheme.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.darkBorder),
            ),
            child: Column(
              children: [
                // En-tête
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: AppTheme.primaryGreen,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        '🎬 CINÉPHORIA',
                        style: TextStyle(
                          color: AppTheme.darkBg,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${detail.cinemaName} - ${detail.city}',
                        style: TextStyle(
                          color: AppTheme.darkBg.withOpacity(0.8),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),

                // QR Code
                Container(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Titre du film
                      Text(
                        detail.filmTitle,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 20),

                      // QR Code
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: QrImageView(
                          data: qrData,
                          version: QrVersions.auto,
                          size: 200,
                          backgroundColor: Colors.white,
                          eyeStyle: const QrEyeStyle(
                            eyeShape: QrEyeShape.square,
                            color: AppTheme.darkBg,
                          ),
                          dataModuleStyle: const QrDataModuleStyle(
                            dataModuleShape: QrDataModuleShape.square,
                            color: AppTheme.darkBg,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Billet #${detail.id}',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),

                // Ligne pointillée
                Row(
                  children: List.generate(
                    30,
                    (_) => Expanded(
                      child: Container(
                        height: 1,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        color: AppTheme.darkBorder,
                      ),
                    ),
                  ),
                ),

                // Détails de la réservation
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      _buildDetailRow(
                        Icons.calendar_today,
                        'Date',
                        dateFormat.format(detail.startTime),
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        Icons.access_time,
                        'Horaire',
                        '${timeFormat.format(detail.startTime)} - ${timeFormat.format(detail.endTime)}',
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        Icons.meeting_room,
                        'Salle',
                        'Salle ${detail.roomNumber} (${detail.quality})',
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        Icons.event_seat,
                        'Places',
                        '${detail.seatsText} (${detail.numSeats} siège${detail.numSeats > 1 ? "s" : ""})',
                      ),
                      const SizedBox(height: 12),
                      _buildDetailRow(
                        Icons.person,
                        'Client',
                        detail.clientName,
                      ),
                      const SizedBox(height: 16),

                      // Prix total
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryGreen.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                color: AppTheme.primaryGreen,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${detail.totalPrice.toStringAsFixed(2)} €',
                              style: const TextStyle(
                                color: AppTheme.primaryGreen,
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Note
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.darkSurface,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: AppTheme.textMuted, size: 18),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Présentez ce QR code à l\'entrée de la salle pour accéder à votre séance.',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Ligne de détail avec icône
  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppTheme.textMuted),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AppTheme.textMuted, fontSize: 11)),
            Text(value, style: const TextStyle(color: AppTheme.textPrimary, fontSize: 14)),
          ],
        ),
      ],
    );
  }
}
