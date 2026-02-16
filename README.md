# Cinéphoria

Plateforme de gestion de cinémas développée dans le cadre du TP Concepteur Développeur d'Applications (Studi 2026).

Cinéphoria est un réseau de cinémas responsables (5 en France, 2 en Belgique) qui reverse 20% de son CA annuel pour soutenir des initiatives écologiques. Ce projet propose une solution complète : site web, application mobile et application bureautique, toutes connectées à une API REST commune.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Backend / API | Node.js, Express.js, JWT |
| Base relationnelle | PostgreSQL |
| Base NoSQL | MongoDB |
| Frontend Web | React (Vite), Tailwind CSS |
| Mobile | Flutter, Provider, Dio |
| Bureautique | Electron |
| Tests | Jest, Supertest |

## Structure du projet

```
cinephoria/
├── backend/              # API REST Node.js
│   ├── src/
│   │   ├── config/       # Connexions PostgreSQL & MongoDB
│   │   ├── controllers/  # Logique métier (auth, films, réservations...)
│   │   ├── middleware/    # JWT, rôles, validation, gestion erreurs
│   │   ├── routes/       # Endpoints REST
│   │   ├── services/     # Services (stats MongoDB)
│   │   └── utils/        # Utilitaires (email, génération MDP)
│   ├── sql/              # Scripts SQL
│   │   ├── create_tables.sql   # Schéma complet
│   │   ├── seed_data.sql       # Données initiales
│   │   └── transaction.sql     # Transaction sécurisée (réservation)
│   └── tests/            # Tests unitaires et fonctionnels
├── frontend/             # Application web React
│   └── src/
│       ├── components/   # Navbar, Footer, FilmCard...
│       ├── pages/        # Home, Films, Reservation, Login...
│       ├── context/      # AuthContext (gestion état global)
│       └── services/     # Appels API via Axios
├── mobile/               # Application mobile Flutter
│   └── lib/
│       ├── screens/      # Écrans (login, home, QR code)
│       ├── providers/    # State management
│       ├── services/     # Appels API via Dio
│       └── models/       # Modèles de données
├── desktop/              # Application bureautique Electron
└── docs/                 # Documentation (MCD, diagrammes)
```

## Déploiement en local

### Prérequis

- Node.js >= 18
- PostgreSQL >= 14
- Git
- Flutter SDK (pour le mobile)
- MongoDB (optionnel, le backend fonctionne sans)

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/cinephoria.git
cd cinephoria
```

### 2. Configurer et lancer le backend

```bash
cd backend
npm install

# Copier le fichier de configuration
cp .env.example .env
# Éditer .env avec vos identifiants PostgreSQL, votre secret JWT, etc.
```

Créer la base de données et importer le schéma :

```bash
psql -U postgres -c "CREATE DATABASE cinephoria;"
psql -U postgres -d cinephoria -f sql/create_tables.sql
psql -U postgres -d cinephoria -f sql/seed_data.sql
```

Hasher les mots de passe des comptes de test :

```bash
npm run db:seed
```

Lancer le serveur :

```bash
npm run dev
# API disponible sur http://localhost:5000
```

### 3. Lancer le frontend

```bash
cd frontend
npm install
npm run dev
# Application web sur http://localhost:5173
```

### 4. Lancer l'application mobile

```bash
cd mobile
flutter pub get
flutter run
# L'app se connecte automatiquement à l'API via 10.0.2.2:5000 (émulateur Android)
```

### 5. Lancer l'application bureautique

```bash
cd desktop
npm install
npm start
```

## Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Administrateur | admin@cinephoria.fr | Admin@1234 |
| Employé | employe.paris@cinephoria.fr | Employe@1234 |
| Utilisateur | user@test.fr | User@1234 |

## Principales routes API

| Méthode | Route | Description | Auth requise |
|---------|-------|-------------|:---:|
| POST | /api/auth/register | Inscription | - |
| POST | /api/auth/login | Connexion | - |
| GET | /api/auth/me | Profil utilisateur | Oui |
| GET | /api/films | Liste des films | - |
| GET | /api/films/latest | Films de la semaine | - |
| GET | /api/films/:id | Détail d'un film | - |
| GET | /api/sessions | Séances disponibles | - |
| GET | /api/sessions/:id/seats | Sièges d'une séance | - |
| POST | /api/reservations | Créer une réservation | Oui |
| GET | /api/reservations/me | Mes réservations | Oui |
| DELETE | /api/reservations/:id | Annuler réservation | Oui |
| POST | /api/reviews | Déposer un avis | Oui |
| POST | /api/contacts | Formulaire de contact | - |
| GET | /api/admin/dashboard | Dashboard (MongoDB) | Admin |
| POST | /api/admin/employees | Créer un employé | Admin |
| POST | /api/incidents | Signaler un incident | Employé |
| GET | /api/quality-prices | Tarifs par qualité | - |

## Sécurité

- Authentification par **JWT** avec expiration configurable
- Hashage **bcrypt** (coût 10) pour les mots de passe
- **Requêtes paramétrées** pour prévenir les injections SQL
- Protection des headers HTTP avec **Helmet**
- **CORS** configuré pour le domaine frontend uniquement
- Politique de mot de passe stricte (8 car. min, majuscule, minuscule, chiffre, caractère spécial)
- Transaction SQL **SERIALIZABLE** avec verrouillage pessimiste (**FOR UPDATE**) pour les réservations
- Trigger PostgreSQL anti-surbooking en filet de sécurité

## Bases de données

**PostgreSQL** (relationnelle) : stocke toutes les données transactionnelles : utilisateurs, films, séances, salles, sièges, réservations, avis, contacts et incidents. Le schéma est normalisé avec des clés étrangères, contraintes CHECK et index pour les performances.

**MongoDB** (NoSQL) : utilisée pour le dashboard administrateur. Les statistiques de réservation y sont dénormalisées (un document par réservation avec film, cinéma, prix). Les agrégations MongoDB ($group, $match) permettent de calculer rapidement le nombre de réservations par film sur 7 jours, sans jointures coûteuses.

## Tests

Les tests couvrent l'authentification (module critique) avec Jest et Supertest :

```bash
cd backend
npm test
```

Couverture : validation des mots de passe, inscription, connexion, accès profil, mot de passe oublié, changement de mot de passe.

## Transaction SQL

Le fichier `backend/sql/transaction.sql` contient une transaction sécurisée pour la réservation de sièges :

1. Isolation **SERIALIZABLE** pour empêcher les lectures fantômes
2. Verrouillage pessimiste (**FOR UPDATE**) sur la séance et les sièges
3. Vérifications : sièges dans la bonne salle, disponibilité physique, pas de double réservation, capacité de la salle
4. INSERT de la réservation + association des sièges + UPDATE du statut
5. COMMIT atomique (tout ou rien)

## Déploiement

- **Frontend** : Vercel
- **Backend** : Render
- **PostgreSQL** : Render PostgreSQL
- **MongoDB** : MongoDB Atlas

## Licence

Projet réalisé dans le cadre de l'ECF - TP Concepteur Développeur d'Applications (Studi, 2026).
