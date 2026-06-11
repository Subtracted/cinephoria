# Cahier des Charges — Cinéphoria

## 1. Contexte

Cinéphoria est un réseau de cinémas responsables fondé il y a plusieurs décennies. L'entreprise exploite 5 cinémas en France (Nantes, Bordeaux, Paris, Toulouse, Lille) et 2 en Belgique (Charleroi, Liège), emploie 80 personnes et génère un chiffre d'affaires de 5 millions d'euros. 20% du CA annuel est reversé à des initiatives écologiques.

Un audit a montré que les clients sont prêts à payer davantage pour un cinéma responsable. Cinéphoria souhaite moderniser son système d'information en proposant une plateforme numérique complète pour améliorer l'expérience client et optimiser la gestion interne.

## 2. Objectifs

### Objectifs principaux
- Permettre aux clients de consulter les films et séances, et de réserver des billets en ligne
- Offrir une application mobile pour accéder aux billets (QR code) directement depuis le smartphone
- Fournir aux employés un outil bureautique pour signaler les incidents en salle
- Donner aux administrateurs un tableau de bord de suivi de l'activité

### Objectifs secondaires
- Centraliser l'ensemble des interactions client via une API unique
- Assurer la sécurité des transactions (anti-surbooking, données personnelles)
- Faciliter le déploiement et la maintenance grâce à une architecture modulaire

## 3. Périmètre fonctionnel

### 3.1 Application Web

| Réf | Fonctionnalité | Utilisateur |
|-----|---------------|-------------|
| US 1 | Menu de navigation global | Visiteur |
| US 2 | Page d'accueil avec les derniers films (ajoutés le mercredi) | Visiteur |
| US 3 | Pied de page (adresse, téléphone, horaires) | Visiteur |
| US 4 | Réservation de billets (choix cinéma, film, séance, sièges) | Visiteur / Utilisateur |
| US 5 | Catalogue des films avec filtres (cinéma, genre, jour) | Visiteur |
| US 6 | Création de compte avec validation email | Visiteur |
| US 7 | Connexion / authentification | Tous |
| US 8 | Espace administrateur (CRUD films/séances/salles, dashboard stats, gestion employés) | Administrateur |
| US 9 | Espace employé (CRUD films/séances/salles, modération avis) | Employé |
| US 10 | Espace utilisateur (commandes, notation des films) | Utilisateur |
| US 11 | Mot de passe oublié (génération auto + changement obligatoire) | Visiteur |
| US 12 | Formulaire de contact | Visiteur / Utilisateur |

### 3.2 Application Mobile

| Réf | Fonctionnalité | Utilisateur |
|-----|---------------|-------------|
| US 13 | Visualisation des séances du jour et à venir | Utilisateur |
| US 14 | Affichage du QR code du billet | Utilisateur |

### 3.3 Application Bureautique

| Réf | Fonctionnalité | Utilisateur |
|-----|---------------|-------------|
| US 15 | Saisie et consultation des incidents en salle | Employé |

## 4. Contraintes techniques

### Architecture
- API REST commune consommée par les trois applications
- Base de données relationnelle obligatoire (PostgreSQL)
- Base de données NoSQL obligatoire (MongoDB)
- Déploiement en ligne obligatoire

### Sécurité
- Authentification par JWT
- Mots de passe : 8 caractères min, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- Hashage bcrypt
- Requêtes paramétrées (anti injection SQL)
- Protection CORS et headers HTTP (Helmet)
- Transaction SQL sécurisée pour les réservations (anti-surbooking)

### Règles métier
- Les films sont ajoutés uniquement le mercredi
- Une séance est définie par : heure début/fin, salle, film, qualité de projection
- Le prix dépend de la qualité de la salle et du nombre de places
- Si le nombre de sièges disponibles est insuffisant, la séance n'est pas proposée
- Un utilisateur non connecté ne peut pas valider une réservation
- Les avis sont soumis à modération par un employé
- La note d'un film est la moyenne des notes des utilisateurs
- Certains sièges sont réservés aux personnes à mobilité réduite (PMR)

### Qualité
- Code versionné avec Git (branches main / develop / feature)
- Tests automatisés sur au moins une fonctionnalité
- Documentation technique (MCD, diagrammes UML)
- README avec instructions de déploiement local

## 5. Stack technique retenue

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Backend | Node.js + Express | Performance I/O async, écosystème mature |
| BDD relationnelle | PostgreSQL | Transactions ACID, isolation SERIALIZABLE |
| BDD NoSQL | MongoDB | Agrégations analytiques pour le dashboard |
| Frontend web | React (Vite) + Tailwind CSS | Composants réutilisables, build rapide |
| Mobile | Flutter | Cross-platform, performances natives |
| Bureautique | Electron | Desktop avec technologies web |
| Auth | JWT + bcrypt | Stateless, compatible multi-clients |
| Tests | Jest + Supertest | Standard Node.js, couverture de code |

## 6. Livrables

- Code source sur dépôt GitHub public
- Applications déployées (frontend sur Vercel, backend sur Render)
- Fichiers SQL : création de tables, données initiales, transaction
- Documentation : MCD, cahier des charges, documentation technique
- Manuel d'utilisation avec identifiants de test
- Charte graphique (palette, police, maquettes)
- Jeu de tests automatisés

## 7. Planning prévisionnel

| Phase | Contenu | Durée estimée |
|-------|---------|---------------|
| 1 | Architecture, BDD, modèle de données | 10h |
| 2 | API REST complète (auth, CRUD, réservation) | 20h |
| 3 | Application web React | 25h |
| 4 | Application mobile Flutter | 15h |
| 5 | Application bureautique Electron | 5h |
| 6 | Tests, déploiement, documentation | 15h |
| **Total** | | **90h** |
