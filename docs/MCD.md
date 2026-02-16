# Modèle Conceptuel de Données (MCD) - Cinéphoria

## Diagramme entité-relation (notation textuelle)

```
┌──────────────┐       1,N  ┌──────────────┐  N,1  ┌──────────────────┐
│   CINEMAS    │◄───────────│    ROOMS     │──────►│  QUALITY_PRICES  │
└──────┬───────┘            └──────┬───────┘       └──────────────────┘
       │ 0,N                       │ 1,N
       │                           │
       │                    ┌──────┴───────┐
       │                    │    SEATS     │
       │                    └──────┬───────┘
       │                           │ 0,N
       │                           │
┌──────┴───────┐            ┌──────┴───────────────┐
│    USERS     │            │  RESERVATION_SEATS   │ (table de liaison)
└──┬───┬───┬───┘            └──────┬───────────────┘
   │   │   │                       │ N,1
   │   │   │                       │
   │   │   │  1,N           ┌──────┴───────┐  N,1  ┌──────────────┐
   │   │   └────────────────│ RESERVATIONS │──────►│   SESSIONS   │
   │   │                    └──────────────┘       └───┬──────┬───┘
   │   │                                               │ N,1  │ N,1
   │   │  1,N   ┌──────────────┐                       │      │
   │   └────────│   REVIEWS    │◄──────────────────────┘      │
   │            └──────────────┘                      ┌────────┘
   │                      ▲ N,1                       │
   │  1,N                 │                    ┌──────┴───────┐
   └──────────────────────┼────────────────────│    FILMS     │
                          │                    └──────────────┘
   ┌──────────────┐       │
   │  INCIDENTS   │       │
   └──────────────┘       │
         ▲ N,1            │
         │                │
    USERS (employee)  FILMS (via reservation)

   ┌──────────────┐
   │   CONTACTS   │  (entité indépendante)
   └──────────────┘
```

---

## Entités, attributs et clés

### CINEMAS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| name | VARCHAR(100) | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| country | VARCHAR(50) | DEFAULT 'France' |
| address | VARCHAR(255) | NOT NULL |
| phone | VARCHAR(20) | |
| opening_hours | VARCHAR(100) | DEFAULT '10:00 - 23:00' |
| created_at | TIMESTAMP | DEFAULT NOW |

---

### USERS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password | VARCHAR(255) | NOT NULL (hash bcrypt) |
| first_name | VARCHAR(100) | NOT NULL |
| last_name | VARCHAR(100) | NOT NULL |
| username | VARCHAR(100) | NOT NULL |
| role | VARCHAR(20) | CHECK ('user', 'employee', 'admin') |
| *cinema_id* | INTEGER | **FK → CINEMAS(id)**, NULL pour user/admin |
| must_change_password | BOOLEAN | DEFAULT FALSE |
| email_verified | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMP | DEFAULT NOW |
| updated_at | TIMESTAMP | DEFAULT NOW |

---

### QUALITY_PRICES
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| quality | VARCHAR(50) | UNIQUE, NOT NULL |
| price | DECIMAL(6,2) | NOT NULL |
| description | VARCHAR(255) | |

---

### ROOMS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *cinema_id* | INTEGER | **FK → CINEMAS(id)**, NOT NULL, ON DELETE CASCADE |
| room_number | INTEGER | NOT NULL |
| capacity | INTEGER | CHECK (> 0) |
| *quality* | VARCHAR(50) | **FK → QUALITY_PRICES(quality)**, ON UPDATE CASCADE |
| is_accessible | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW |

**Contrainte unique** : (cinema_id, room_number)

---

### SEATS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *room_id* | INTEGER | **FK → ROOMS(id)**, NOT NULL, ON DELETE CASCADE |
| seat_number | INTEGER | NOT NULL |
| seat_row | CHAR(1) | NOT NULL |
| is_pmr | BOOLEAN | DEFAULT FALSE (mobilité réduite) |
| is_available | BOOLEAN | DEFAULT TRUE |

**Contrainte unique** : (room_id, seat_row, seat_number)

---

### FILMS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| poster_url | VARCHAR(500) | |
| min_age | INTEGER | DEFAULT 0 |
| is_coup_de_coeur | BOOLEAN | DEFAULT FALSE |
| genre | VARCHAR(100) | |
| duration | INTEGER | NOT NULL (minutes) |
| added_date | DATE | DEFAULT CURRENT_DATE |
| created_at | TIMESTAMP | DEFAULT NOW |
| updated_at | TIMESTAMP | DEFAULT NOW |

---

### SESSIONS (séances)
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *film_id* | INTEGER | **FK → FILMS(id)**, NOT NULL, ON DELETE CASCADE |
| *room_id* | INTEGER | **FK → ROOMS(id)**, NOT NULL, ON DELETE CASCADE |
| start_time | TIMESTAMP | NOT NULL |
| end_time | TIMESTAMP | NOT NULL |
| created_at | TIMESTAMP | DEFAULT NOW |

**Contrainte CHECK** : end_time > start_time

---

### RESERVATIONS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *user_id* | INTEGER | **FK → USERS(id)**, NOT NULL, ON DELETE CASCADE |
| *session_id* | INTEGER | **FK → SESSIONS(id)**, NOT NULL, ON DELETE CASCADE |
| total_price | DECIMAL(8,2) | NOT NULL |
| num_seats | INTEGER | CHECK (> 0) |
| status | VARCHAR(20) | CHECK ('pending', 'confirmed', 'cancelled', 'used') |
| created_at | TIMESTAMP | DEFAULT NOW |

---

### RESERVATION_SEATS (table de liaison)
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *reservation_id* | INTEGER | **FK → RESERVATIONS(id)**, ON DELETE CASCADE |
| *seat_id* | INTEGER | **FK → SEATS(id)**, ON DELETE CASCADE |

**Contrainte unique** : (reservation_id, seat_id)
**Trigger** : `trg_no_double_booking` → empêche un siège réservé 2 fois pour la même séance

---

### REVIEWS (avis)
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *user_id* | INTEGER | **FK → USERS(id)**, ON DELETE CASCADE |
| *film_id* | INTEGER | **FK → FILMS(id)**, ON DELETE CASCADE |
| *reservation_id* | INTEGER | **FK → RESERVATIONS(id)**, ON DELETE SET NULL |
| rating | INTEGER | CHECK (1 à 5) |
| description | TEXT | |
| status | VARCHAR(20) | CHECK ('pending', 'approved', 'rejected') |
| created_at | TIMESTAMP | DEFAULT NOW |

**Contrainte unique** : (user_id, film_id) → un seul avis par utilisateur par film

---

### CONTACTS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| username | VARCHAR(100) | Facultatif |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | NOT NULL |
| email | VARCHAR(255) | Facultatif |
| created_at | TIMESTAMP | DEFAULT NOW |

---

### INCIDENTS
| Attribut | Type | Contrainte |
|----------|------|-----------|
| **id** | SERIAL | **PK** |
| *employee_id* | INTEGER | **FK → USERS(id)**, NOT NULL, ON DELETE CASCADE |
| *room_id* | INTEGER | **FK → ROOMS(id)**, NOT NULL, ON DELETE CASCADE |
| description | TEXT | NOT NULL |
| seat_number | VARCHAR(10) | Facultatif |
| status | VARCHAR(20) | CHECK ('open', 'in_progress', 'resolved') |
| created_at | TIMESTAMP | DEFAULT NOW |
| updated_at | TIMESTAMP | DEFAULT NOW |

---

## Cardinalités

| Relation | Cardinalité | Description |
|----------|------------|-------------|
| CINEMAS → ROOMS | 1,N | Un cinéma possède plusieurs salles |
| CINEMAS → USERS | 0,N | Un cinéma peut avoir plusieurs employés |
| ROOMS → SEATS | 1,N | Une salle contient plusieurs sièges |
| ROOMS → SESSIONS | 0,N | Une salle accueille plusieurs séances |
| ROOMS → INCIDENTS | 0,N | Une salle peut avoir plusieurs incidents |
| QUALITY_PRICES → ROOMS | 1,N | Une qualité est attribuée à plusieurs salles |
| FILMS → SESSIONS | 0,N | Un film peut être projeté dans plusieurs séances |
| FILMS → REVIEWS | 0,N | Un film peut recevoir plusieurs avis |
| USERS → RESERVATIONS | 0,N | Un utilisateur peut faire plusieurs réservations |
| USERS → REVIEWS | 0,N | Un utilisateur peut déposer plusieurs avis |
| USERS → INCIDENTS | 0,N | Un employé peut signaler plusieurs incidents |
| SESSIONS → RESERVATIONS | 0,N | Une séance peut avoir plusieurs réservations |
| RESERVATIONS → RESERVATION_SEATS | 1,N | Une réservation concerne 1 à N sièges |
| SEATS → RESERVATION_SEATS | 0,N | Un siège peut être réservé pour plusieurs séances |

---

## Contraintes métier importantes

| Règle | Implémentation |
|-------|---------------|
| Pas de surbooking | Trigger `trg_no_double_booking` + FOR UPDATE + SERIALIZABLE |
| 1 avis / utilisateur / film | UNIQUE(user_id, film_id) sur reviews |
| Salle unique par cinéma | UNIQUE(cinema_id, room_number) sur rooms |
| Siège unique par salle | UNIQUE(room_id, seat_row, seat_number) sur seats |
| Séance cohérente | CHECK(end_time > start_time) sur sessions |
| Capacité positive | CHECK(capacity > 0) sur rooms |
| Note entre 1 et 5 | CHECK(rating >= 1 AND rating <= 5) sur reviews |
| Rôles limités | CHECK(role IN ('user','employee','admin')) sur users |
| Statut réservation | CHECK(status IN ('pending','confirmed','cancelled','used')) |
| MDP sécurisé | Applicatif : 8 car., maj, min, chiffre, spécial |
| Films ajoutés le mercredi | Applicatif : added_date contrôlé côté API |

---

## Base NoSQL (MongoDB)

**Collection : `reservation_stats`** (dashboard admin)

```json
{
  "reservationId": 1,
  "filmId": 3,
  "filmTitle": "Le Dernier Voyage",
  "cinemaId": 1,
  "cinemaName": "Cinéphoria Paris",
  "quality": "4DX",
  "reservationCount": 1,
  "seatCount": 3,
  "revenue": 54.00,
  "date": "2026-02-13T14:30:00Z"
}
```

Utilisée pour l'agrégation des réservations par film sur 7 jours (US 8).
