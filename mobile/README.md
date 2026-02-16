# Cinéphoria Mobile

Application mobile Flutter pour les clients Cinéphoria. Elle permet de consulter ses réservations et d'afficher le QR code du billet pour le présenter à l'entrée de la salle.

## Fonctionnalités

- Connexion au compte utilisateur
- Visualisation des séances à venir et du jour (US 13)
- Affichage du QR code du billet pour chaque réservation (US 14)
- Détails complets : film, salle, sièges, horaire, prix

## Stack

- Flutter 3.41
- Provider (state management)
- Dio (appels API)
- flutter_secure_storage (stockage sécurisé du token)
- qr_flutter (génération QR code)

## Lancement

```bash
flutter pub get
flutter run
```

L'application se connecte à l'API backend sur `http://10.0.2.2:5000/api` (émulateur Android) ou `http://localhost:5000/api` (iOS).

## Compte de test

- Email : user@test.fr
- Mot de passe : User@1234
