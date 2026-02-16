-- ============================================
-- CINÉPHORIA - Création des tables PostgreSQL
-- ============================================

-- Suppression des tables existantes (ordre inverse des dépendances)
DROP TABLE IF EXISTS reservation_seats CASCADE;
DROP TABLE IF EXISTS reservations CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS films CASCADE;
DROP TABLE IF EXISTS quality_prices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS cinemas CASCADE;

-- ============================================
-- Table : cinemas
-- ============================================
CREATE TABLE cinemas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL DEFAULT 'France',
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    opening_hours VARCHAR(100) DEFAULT '10:00 - 23:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table : users
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'employee', 'admin')),
    cinema_id INTEGER REFERENCES cinemas(id) ON DELETE SET NULL,
    must_change_password BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table : quality_prices (tarification par qualité)
-- ============================================
CREATE TABLE quality_prices (
    id SERIAL PRIMARY KEY,
    quality VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(6,2) NOT NULL,
    description VARCHAR(255)
);

-- ============================================
-- Table : rooms (salles de cinéma)
-- ============================================
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    cinema_id INTEGER NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    room_number INTEGER NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    quality VARCHAR(50) NOT NULL REFERENCES quality_prices(quality) ON UPDATE CASCADE,
    is_accessible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cinema_id, room_number)
);

-- ============================================
-- Table : seats (sièges)
-- ============================================
CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    seat_number INTEGER NOT NULL,
    seat_row CHAR(1) NOT NULL,
    is_pmr BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE(room_id, seat_row, seat_number)
);

-- ============================================
-- Table : films
-- ============================================
CREATE TABLE films (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_url VARCHAR(500),
    min_age INTEGER DEFAULT 0,
    is_coup_de_coeur BOOLEAN DEFAULT FALSE,
    genre VARCHAR(100),
    duration INTEGER NOT NULL, -- durée en minutes
    added_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table : sessions (séances)
-- ============================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_times CHECK (end_time > start_time)
);

-- Index pour optimiser les recherches de séances
CREATE INDEX idx_sessions_film ON sessions(film_id);
CREATE INDEX idx_sessions_room ON sessions(room_id);
CREATE INDEX idx_sessions_start ON sessions(start_time);

-- ============================================
-- Table : reservations
-- ============================================
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    total_price DECIMAL(8,2) NOT NULL,
    num_seats INTEGER NOT NULL CHECK (num_seats > 0),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'used')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_session ON reservations(session_id);

-- ============================================
-- Table : reservation_seats (sièges réservés)
-- ============================================
CREATE TABLE reservation_seats (
    id SERIAL PRIMARY KEY,
    reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    seat_id INTEGER NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    UNIQUE(reservation_id, seat_id)
);

-- ============================================
-- TRIGGER ANTI-SURBOOKING
-- Filet de sécurité au niveau BDD : empêche qu'un siège
-- soit réservé deux fois pour la même séance active.
-- Protège même en cas de bug applicatif.
-- ============================================
CREATE OR REPLACE FUNCTION check_no_double_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id INTEGER;
    v_existing INTEGER;
BEGIN
    -- Récupérer la séance de cette réservation
    SELECT session_id INTO v_session_id
    FROM reservations
    WHERE id = NEW.reservation_id;

    -- Vérifier qu'aucune autre réservation active n'a ce siège pour cette séance
    SELECT COUNT(*) INTO v_existing
    FROM reservation_seats rs
    JOIN reservations r ON r.id = rs.reservation_id
    WHERE rs.seat_id = NEW.seat_id
      AND r.session_id = v_session_id
      AND r.status IN ('confirmed', 'pending')
      AND rs.id != COALESCE(NEW.id, 0);

    IF v_existing > 0 THEN
        RAISE EXCEPTION 'SURBOOKING BLOQUÉ : le siège % est déjà réservé pour la séance %',
            NEW.seat_id, v_session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_no_double_booking
BEFORE INSERT ON reservation_seats
FOR EACH ROW
EXECUTE FUNCTION check_no_double_booking();

-- ============================================
-- Table : reviews (avis sur les films)
-- ============================================
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    film_id INTEGER NOT NULL REFERENCES films(id) ON DELETE CASCADE,
    reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, film_id)
);

-- ============================================
-- Table : contacts (formulaire de contact)
-- ============================================
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table : incidents (signalements employés)
-- ============================================
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    seat_number VARCHAR(10),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_room ON incidents(room_id);
CREATE INDEX idx_incidents_status ON incidents(status);
