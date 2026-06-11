# Fiche de Projet — Cinéphoria

## Informations générales

| | |
|-|-|
| **Titre** | Cinéphoria — Plateforme de gestion de cinémas |
| **Candidat** | Arthur |
| **Formation** | TP Concepteur Développeur d'Applications (Studi) |
| **Date** | Février 2026 |
| **Durée estimée** | 90 heures |

## Description du projet

Cinéphoria est une plateforme complète de gestion de cinémas comprenant trois applications connectées à une API REST commune :

- **Application web** : site public pour consulter les films, réserver des billets et gérer les espaces utilisateur, employé et administrateur. Développée en React avec Tailwind CSS.

- **Application mobile** : application Flutter permettant aux clients de consulter leurs réservations et d'afficher le QR code de leur billet pour le présenter à l'entrée.

- **Application bureautique** : application Electron dédiée aux employés pour signaler et suivre les incidents dans les salles de cinéma (siège cassé, matériel défaillant, etc.).

L'ensemble repose sur une API Node.js/Express avec deux bases de données : PostgreSQL pour les données transactionnelles et MongoDB pour les statistiques du dashboard administrateur.

## Technologies utilisées

| Composant | Technologies |
|-----------|-------------|
| Backend | Node.js, Express.js, JWT, bcrypt |
| BDD relationnelle | PostgreSQL |
| BDD NoSQL | MongoDB |
| Frontend web | React, Vite, Tailwind CSS, Axios |
| Mobile | Flutter, Provider, Dio, qr_flutter |
| Bureautique | Electron |
| Tests | Jest, Supertest |
| Déploiement | Vercel (front), Render (back + BDD), GitHub |
| Conteneurisation | Docker, docker-compose |

## Mon rôle

J'ai conçu et développé l'intégralité du projet en autonomie : analyse des besoins à partir des user stories, modélisation de la base de données, développement backend et frontend, intégration des trois applications, mise en place des tests, déploiement en production et rédaction de la documentation.

## Difficultés rencontrées et solutions

### Système de réservation et anti-surbooking

La problématique la plus complexe du projet. En situation de réservations concurrentes, deux utilisateurs peuvent tenter de réserver le même siège au même instant. Ma première implémentation ne gérait pas ce cas.

**Solution :** j'ai mis en place une stratégie en trois couches :
1. Transaction SQL avec isolation SERIALIZABLE pour empêcher les lectures fantômes
2. Verrouillage pessimiste (SELECT FOR UPDATE) sur la séance et les sièges pour bloquer les accès concurrents
3. Trigger PostgreSQL `trg_no_double_booking` comme filet de sécurité au niveau base de données

Chaque couche couvre un cas limite que la précédente ne gère pas seule.

### Compatibilité Tailwind CSS v4

La migration vers Tailwind CSS v4 a provoqué des erreurs au lancement : le plugin PostCSS a été déplacé dans un package séparé (`@tailwindcss/postcss`), le fichier `tailwind.config.js` est devenu obsolète, et la configuration passe désormais par des directives CSS (`@theme`).

**Solution :** migration complète de la configuration : suppression de `postcss.config.js` et `tailwind.config.js`, utilisation du plugin `@tailwindcss/vite`, et réécriture des couleurs custom en `@theme` dans le CSS.

### Déploiement et connexion BDD distante

Le backend fonctionnait en local mais pas sur Render : PostgreSQL distant exige SSL, et le CORS bloquait les requêtes depuis Vercel.

**Solution :** ajout du support `DATABASE_URL` avec `ssl: { rejectUnauthorized: false }` dans la configuration du pool PostgreSQL, et mise à jour du middleware CORS pour accepter les domaines `.vercel.app`.

### Flutter 3.41 — erreurs de compatibilité

Le premier build Flutter a nécessité plus de 10 minutes (téléchargement NDK, Build Tools, SDK Platform). Ensuite, des erreurs de compilation : `CardTheme` renommé en `CardThemeData`, et des propriétés `QrEyeShape.roundedOuter` supprimées dans qr_flutter.

**Solution :** mise à jour des types selon l'API Flutter 3.41 et remplacement des propriétés obsolètes de qr_flutter.

## Bilan

Le projet couvre l'ensemble des user stories demandées (US 1 à US 15). L'architecture modulaire avec une API REST centrale permet aux trois applications de fonctionner indépendamment tout en partageant les mêmes données. Le système de réservation est sécurisé contre le surbooking grâce à une triple protection (transaction + verrouillage + trigger). Les tests automatisés couvrent le module d'authentification, qui est le point d'entrée de toutes les fonctionnalités protégées.

Si c'était à refaire, je vérifierais les versions de chaque bibliothèque avant de démarrer et j'aurais mis en place un pipeline CI/CD avec GitHub Actions dès le début du projet.
