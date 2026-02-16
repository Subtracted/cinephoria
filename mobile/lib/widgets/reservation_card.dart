import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../config/theme.dart';
import '../models/reservation.dart';

/// Carte de réservation affichée dans la liste principale (US 13)
/// Affiche : affiche du film, nom, jour, salle, sièges, horaires
class ReservationCard extends StatelessWidget {
  final Reservation reservation;
  final VoidCallback onTap;
  final bool isToday;

  const ReservationCard({
    super.key,
    required this.reservation,
    required this.onTap,
    this.isToday = false,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('EEEE d MMM', 'fr_FR');
    final timeFormat = DateFormat('HH:mm', 'fr_FR');

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.darkCard,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isToday
                ? AppTheme.primaryGreen.withOpacity(0.3)
                : AppTheme.darkBorder,
          ),
        ),
        child: Row(
          children: [
            // Affiche du film
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(left: Radius.circular(14)),
              child: Container(
                width: 90,
                height: 130,
                color: AppTheme.darkSurface,
                child: reservation.posterUrl != null
                    ? Image.network(
                        reservation.posterUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Text('🎬', style: TextStyle(fontSize: 36)),
                        ),
                      )
                    : const Center(
                        child: Text('🎬', style: TextStyle(fontSize: 36)),
                      ),
              ),
            ),

            // Informations
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Titre du film
                    Text(
                      reservation.filmTitle,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),

                    // Date et heure
                    Row(
                      children: [
                        const Icon(Icons.calendar_today, size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          dateFormat.format(reservation.startTime),
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Text(
                          '${timeFormat.format(reservation.startTime)} - ${timeFormat.format(reservation.endTime)}',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    // Salle et sièges
                    Row(
                      children: [
                        const Icon(Icons.meeting_room, size: 14, color: AppTheme.textMuted),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            'Salle ${reservation.roomNumber} • ${reservation.quality} • ${reservation.seatsText}',
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Flèche + badge
            Padding(
              padding: const EdgeInsets.only(right: 14),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (isToday)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryGreen.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text(
                        'Aujourd\'hui',
                        style: TextStyle(
                          color: AppTheme.primaryGreen,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  const SizedBox(height: 8),
                  const Icon(
                    Icons.qr_code_2,
                    color: AppTheme.primaryGreen,
                    size: 28,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
