import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/reservation.dart';
import '../providers/auth_provider.dart';
import '../providers/reservation_provider.dart';
import '../widgets/reservation_card.dart';
import 'login_screen.dart';
import 'qr_code_screen.dart';

/// Écran principal - Liste des séances du jour et à venir (US 13)
/// Affiche les réservations confirmées de l'utilisateur
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Charger les réservations au démarrage
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ReservationProvider>(context, listen: false).loadReservations();
    });
  }

  void _navigateToQrCode(Reservation reservation) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QrCodeScreen(reservationId: reservation.id),
      ),
    );
  }

  Future<void> _logout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('🎬 Cinéphoria'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.textSecondary),
            tooltip: 'Déconnexion',
            onPressed: _logout,
          ),
        ],
      ),
      body: Consumer<ReservationProvider>(
        builder: (context, reservationProvider, _) {
          return RefreshIndicator(
            onRefresh: reservationProvider.refresh,
            color: AppTheme.primaryGreen,
            child: CustomScrollView(
              slivers: [
                // En-tête utilisateur
                SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Bonjour, ${user?.firstName ?? ''} 👋',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(DateTime.now()),
                          style: const TextStyle(
                            color: AppTheme.textSecondary,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Chargement
                if (reservationProvider.isLoading)
                  const SliverFillRemaining(
                    child: Center(
                      child: CircularProgressIndicator(color: AppTheme.primaryGreen),
                    ),
                  ),

                // Erreur
                if (reservationProvider.error != null && !reservationProvider.isLoading)
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 20),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.errorColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        reservationProvider.error!,
                        style: const TextStyle(color: AppTheme.errorColor),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),

                // Séances du jour
                if (!reservationProvider.isLoading) ...[
                  _buildSectionHeader('Aujourd\'hui', reservationProvider.todayReservations.length),

                  if (reservationProvider.todayReservations.isEmpty)
                    SliverToBoxAdapter(
                      child: _buildEmptyState('Aucune séance aujourd\'hui'),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final reservation = reservationProvider.todayReservations[index];
                          return ReservationCard(
                            reservation: reservation,
                            onTap: () => _navigateToQrCode(reservation),
                            isToday: true,
                          );
                        },
                        childCount: reservationProvider.todayReservations.length,
                      ),
                    ),

                  // Séances à venir
                  _buildSectionHeader('Prochaines séances', reservationProvider.futureReservations.length),

                  if (reservationProvider.futureReservations.isEmpty)
                    SliverToBoxAdapter(
                      child: _buildEmptyState('Aucune séance à venir'),
                    )
                  else
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final reservation = reservationProvider.futureReservations[index];
                          return ReservationCard(
                            reservation: reservation,
                            onTap: () => _navigateToQrCode(reservation),
                            isToday: false,
                          );
                        },
                        childCount: reservationProvider.futureReservations.length,
                      ),
                    ),
                ],

                // Espace en bas
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          );
        },
      ),
    );
  }

  /// En-tête de section
  SliverToBoxAdapter _buildSectionHeader(String title, int count) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
        child: Row(
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: AppTheme.primaryGreen.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '$count',
                style: const TextStyle(
                  color: AppTheme.primaryGreen,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// État vide
  Widget _buildEmptyState(String message) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        children: [
          const Text('🎟️', style: TextStyle(fontSize: 36)),
          const SizedBox(height: 8),
          Text(
            message,
            style: const TextStyle(color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }
}
