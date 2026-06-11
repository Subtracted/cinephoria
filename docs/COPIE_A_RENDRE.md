# Copie à rendre — TP Concepteur Développeur d'Applications

---

## Partie 1 : Livrables

**Lien outil de gestion de projet :**
https://github.com/users/Subtracted/projects (Kanban GitHub Projects)

**Lien Git :**
https://github.com/Subtracted/cinephoria

**Liens des applications déployées :**
- Application web : https://cinephoria-two.vercel.app
- API Backend : https://cinephoria-v29b.onrender.com

**Login et mot de passe du compte administrateur :**
- Email : admin@cinephoria.fr
- Mot de passe : Admin@1234

---

## Partie 2 : Planification

### Comment avez-vous effectué la planification de votre projet ?

J'ai commencé par analyser l'ensemble des user stories (US 1 à US 15) pour identifier les dépendances entre elles et estimer la charge de travail de chacune. J'ai découpé le projet en grandes phases : d'abord la modélisation de la base de données et l'architecture, puis le développement de l'API backend, ensuite l'application web, et enfin le mobile et le bureau.

Pour chaque phase, j'ai listé les tâches concrètes à réaliser et je les ai ordonnées par priorité. Par exemple, les fonctionnalités d'authentification (US 6, 7) devaient être développées en premier car la réservation (US 4), l'espace utilisateur (US 10) et le dashboard admin (US 8) en dépendent.

J'ai utilisé un tableau Kanban sur GitHub Projects avec les colonnes suivantes :
- **Backlog** : toutes les fonctionnalités prévues, ordonnées par priorité
- **To Do** : fonctionnalités planifiées pour le sprint en cours
- **In Progress** : fonctionnalités en cours de développement
- **Done (develop)** : fonctionnalités terminées et mergées sur la branche develop
- **Released (main)** : fonctionnalités validées et mergées sur main

### Quelle méthode de gestion de projet avez-vous utilisé, et pourquoi ?

J'ai utilisé une approche Agile simplifiée, inspirée de Scrum mais adaptée à un projet individuel. Plutôt que des sprints rigides de 2 semaines, j'ai travaillé par itérations courtes en me concentrant sur un bloc fonctionnel à la fois.

Ce choix s'explique par la nature du projet : en tant que développeur seul, les cérémonies Scrum classiques (daily, sprint review) n'avaient pas de sens. En revanche, le principe de livrer des incréments fonctionnels régulièrement m'a permis de tester au fur et à mesure et d'éviter l'effet tunnel.

Le workflow Git reflète cette approche : une branche `main` pour la production, une branche `develop` pour le développement, et des commits par fonctionnalité. Chaque bloc (API, web, mobile, desktop) a été développé, testé puis mergé dans develop, avant un merge final dans main une fois la version stable validée.

---

## Partie 3 : Technologies utilisées

### Quelles technologies avez-vous utilisées ?

**Backend (API REST) :**
- **Node.js + Express.js** : j'ai choisi Node.js pour sa performance en I/O asynchrone, idéale pour une API REST qui gère beaucoup de requêtes simultanées (réservations, consultations de séances). Express est le framework le plus mature de l'écosystème Node, avec une communauté très active et une grande flexibilité pour structurer une API en MVC.
- **PostgreSQL** : base de données relationnelle robuste, choisie pour la gestion des données transactionnelles (utilisateurs, réservations, séances). PostgreSQL offre un support natif des transactions ACID avec isolation SERIALIZABLE, indispensable pour empêcher les problèmes de surbooking lors des réservations concurrentes. Son système de triggers m'a aussi permis d'ajouter une couche de sécurité supplémentaire directement dans la base.
- **MongoDB** : base NoSQL utilisée uniquement pour le dashboard administrateur (statistiques de réservations). Ce choix suit le pattern CQRS simplifié : PostgreSQL gère les écritures transactionnelles, MongoDB gère les lectures analytiques. Les agrégations MongoDB ($group, $match, $sort) sont beaucoup plus performantes qu'un GROUP BY avec 5 JOINs pour un dashboard temps réel. Le schéma flexible de MongoDB permet aussi de stocker des données dénormalisées sans contraintes de jointure.
- **JWT (JSON Web Tokens)** : pour l'authentification stateless, compatible avec toutes les applications (web, mobile, desktop) sans nécessiter de session côté serveur.
- **bcrypt** : pour le hashage des mots de passe avec un coût de 10 rounds.

**Frontend Web :**
- **React (via Vite)** : j'ai choisi React pour sa gestion efficace du DOM virtuel et son écosystème de composants réutilisables. Vite a été préféré à Create React App pour sa rapidité de build (Hot Module Replacement quasi instantané) et sa configuration plus légère.
- **Tailwind CSS** : framework CSS utility-first qui accélère le développement d'interfaces sans écrire de CSS custom. Il permet une cohérence visuelle sur toutes les pages et un design responsive sans effort supplémentaire.
- **Axios** : client HTTP avec intercepteurs pour gérer automatiquement les tokens JWT et la redirection en cas d'expiration.

**Application Mobile :**
- **Flutter** : framework cross-platform de Google, choisi pour pouvoir développer une seule base de code pour Android et iOS. L'approche widget de Flutter offre des performances natives et un rendu cohérent sur toutes les plateformes. Provider gère l'état global, Dio gère les appels API, et flutter_secure_storage assure le stockage sécurisé du token JWT sur l'appareil.

**Application Bureautique :**
- **Electron** : permet de créer une application desktop avec des technologies web (HTML/CSS/JS). C'est le choix le plus rapide pour une application connectée à l'API, car on réutilise les mêmes compétences que pour le web. L'application est dédiée aux employés pour signaler les incidents en salle.

**Pourquoi cette stack est adaptée à la demande :**

L'énoncé exige trois applications (web, mobile, bureau) connectées à une API commune. La stack Node.js/Express est parfaite pour cette architecture car elle fournit un point d'entrée unique en REST que chaque client consomme de façon indépendante. Le choix de JWT permet une authentification unifiée sans dépendance côté serveur. Côté bases de données, PostgreSQL couvre les besoins transactionnels critiques (réservations avec anti-surbooking), tandis que MongoDB couvre les besoins analytiques du dashboard admin, ce qui satisfait l'exigence de l'énoncé d'avoir une base relationnelle ET une base NoSQL.

### Quelles mesures avez-vous prises pour protéger vos applications ?

**Protection contre les injections SQL :**
Toutes les requêtes PostgreSQL utilisent des requêtes paramétrées (parameterized queries) avec le module `pg`. Aucune concaténation de chaînes dans les requêtes SQL. Exemple : `query('SELECT * FROM users WHERE email = $1', [email])`. Les valeurs sont toujours passées en paramètres, ce qui empêche toute injection.

**Protection XSS :**
- Le middleware **Helmet** configure les headers HTTP de sécurité (Content-Security-Policy, X-XSS-Protection, X-Content-Type-Options, etc.)
- Les entrées utilisateur sont validées côté serveur avant traitement (middleware de validation)
- React échappe automatiquement les sorties dans le JSX, ce qui empêche l'injection de scripts dans le DOM

**Authentification et autorisation :**
- Mots de passe hashés avec **bcrypt** (coût 10, irréversible)
- Politique de mot de passe stricte : 8 caractères minimum, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
- Tokens **JWT** avec expiration de 24h
- Middleware `authorize()` qui vérifie le rôle de l'utilisateur avant chaque route protégée (admin, employé, utilisateur)

**Protection CORS :**
Le backend n'accepte que les requêtes provenant du domaine frontend autorisé (Vercel). Les requêtes d'origines inconnues sont rejetées.

**Intégrité des données :**
- Transaction SQL avec isolation **SERIALIZABLE** pour les réservations, empêchant les lectures fantômes et les conditions de course
- Verrouillage pessimiste (**SELECT ... FOR UPDATE**) sur les séances et les sièges lors d'une réservation
- Trigger PostgreSQL `trg_no_double_booking` qui bloque au niveau base de données toute tentative de réserver un siège déjà pris, même en cas de bug applicatif
- Contraintes CHECK et UNIQUE sur les colonnes critiques (statuts, unicité email, unicité siège par salle)

**Stockage mobile sécurisé :**
Le token JWT est stocké via `flutter_secure_storage`, qui utilise le Keychain sur iOS et le EncryptedSharedPreferences sur Android.

### Décrivez les tests applicatifs que vous avez effectués

J'ai mis en place des tests automatisés sur la fonctionnalité d'authentification, car c'est le module le plus critique (il conditionne l'accès à toutes les fonctionnalités protégées). Les tests utilisent **Jest** comme framework de test et **Supertest** pour simuler les appels HTTP.

Les tests couvrent :

**Tests unitaires :**
- Validation du format de mot de passe (respect des règles : longueur, majuscule, minuscule, chiffre, caractère spécial)
- Génération automatique de mot de passe conforme à la politique
- Vérification du format de token JWT

**Tests fonctionnels (intégration) :**
- Inscription d'un nouvel utilisateur avec données valides
- Rejet de l'inscription avec email déjà existant
- Rejet avec mot de passe trop faible
- Connexion avec identifiants corrects (réception du token)
- Rejet de connexion avec mauvais mot de passe
- Accès au profil avec token valide
- Rejet d'accès sans token ou avec token invalide
- Demande de mot de passe oublié
- Changement de mot de passe

La commande `npm test` dans le dossier backend lance l'ensemble des tests avec un rapport de couverture.

### Comment avez-vous effectué le déploiement ?

Le déploiement suit une architecture cloud avec des services gratuits adaptés au projet :

- **Frontend** déployé sur **Vercel** : Vercel est connecté directement au dépôt GitHub. À chaque push sur la branche `main`, Vercel déclenche automatiquement un build (`vite build`) et déploie la nouvelle version. Le root directory est configuré sur `frontend/`, et la variable d'environnement `VITE_API_URL` pointe vers l'API Render.

- **Backend** déployé sur **Render** : même principe de déploiement continu depuis GitHub. Le service est de type Web Service (Node.js), avec `npm install` comme commande de build et `node src/app.js` comme commande de démarrage. Les variables d'environnement (connexion BDD, JWT, CORS) sont configurées dans l'interface Render.

- **Base PostgreSQL** hébergée sur **Render** : une instance PostgreSQL gratuite héberge le schéma complet (11 tables, trigger anti-surbooking, index). Les scripts `create_tables.sql` et `seed_data.sql` ont été exécutés via `psql` pour initialiser la base distante.

- **CI/CD** : le déploiement continu est assuré par l'intégration GitHub → Vercel et GitHub → Render. À chaque push sur `main`, les deux services redéploient automatiquement. Il n'y a pas de pipeline CI/CD supplémentaire (type GitHub Actions) car les tests sont lancés manuellement en local avant chaque push. Pour un projet en production, j'aurais ajouté un workflow GitHub Actions avec les étapes : lint → test → build → deploy.

---

## Partie 4 : Informations complémentaires

Ce projet a été un vrai défi technique, et honnêtement, le parcours n'a pas été de tout repos.

La partie qui m'a donné le plus de fil à retordre, c'est la **sécurisation du système de réservation**. Quand j'ai commencé à implémenter les réservations, ça avait l'air simple : un INSERT dans la table reservations et c'est réglé. Mais en creusant, j'ai réalisé que si deux personnes réservent le même siège au même moment, on se retrouve avec un surbooking. J'ai dû me plonger dans les transactions SQL, comprendre les niveaux d'isolation (j'ai fini par utiliser SERIALIZABLE), mettre en place du verrouillage pessimiste avec FOR UPDATE, et ajouter un trigger en base comme filet de sécurité. Chaque couche corrigeait un cas limite que la précédente ne couvrait pas.

L'intégration de **Tailwind CSS v4** avec Vite a aussi posé problème. La version 4 a changé complètement la façon de configurer Tailwind : le plugin PostCSS a été déplacé dans un package séparé, le fichier `tailwind.config.js` n'existe plus, et la configuration passe par des directives CSS (`@theme`). J'ai dû migrer toute la configuration, corriger des erreurs de classes inconnues, et comprendre la nouvelle syntaxe. Ce genre de problème de compatibilité entre versions n'est pas documenté de façon claire quand on est entre deux versions.

Le **déploiement** a aussi été source de bugs. La connexion PostgreSQL marchait en local mais pas sur Render parce que la base distante exige SSL. Il a fallu modifier la configuration du pool de connexions pour supporter DATABASE_URL avec SSL en production tout en gardant la compatibilité locale. Le CORS aussi a nécessité des ajustements : le frontend sur Vercel était bloqué par le backend qui n'acceptait que localhost.

Côté mobile, **Flutter** m'a surpris par la quantité de configuration nécessaire avant de pouvoir simplement lancer l'application : installation du SDK, Android Studio, NDK, Build Tools, licences Android... Et le premier build Gradle a pris plus de 10 minutes. J'ai aussi rencontré des erreurs de compatibilité avec Flutter 3.41 (CardTheme renommé en CardThemeData, certaines propriétés de qr_flutter supprimées).

Malgré ces difficultés, je suis satisfait du résultat. Le système de réservation est solide avec une triple protection (transaction SERIALIZABLE + FOR UPDATE + trigger), l'architecture est propre avec une séparation claire entre les couches, et les trois applications (web, mobile, desktop) communiquent correctement avec l'API. Si c'était à refaire, je prendrais plus de temps en amont pour vérifier la compatibilité des versions de chaque bibliothèque avant de commencer le développement.
