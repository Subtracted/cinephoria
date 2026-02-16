-- ============================================
-- CINÉPHORIA - Données d'initialisation
-- ============================================

-- Insertion des cinémas
INSERT INTO cinemas (name, city, country, address, phone, opening_hours) VALUES
('Cinéphoria Nantes', 'Nantes', 'France', '12 Rue du Cinéma, 44000 Nantes', '+33 2 40 00 00 01', '10:00 - 23:00'),
('Cinéphoria Bordeaux', 'Bordeaux', 'France', '25 Avenue des Films, 33000 Bordeaux', '+33 5 56 00 00 02', '10:00 - 23:00'),
('Cinéphoria Paris', 'Paris', 'France', '88 Boulevard Haussmann, 75008 Paris', '+33 1 42 00 00 03', '09:00 - 00:00'),
('Cinéphoria Toulouse', 'Toulouse', 'France', '5 Place du Capitole, 31000 Toulouse', '+33 5 61 00 00 04', '10:00 - 23:00'),
('Cinéphoria Lille', 'Lille', 'France', '15 Rue de Béthune, 59000 Lille', '+33 3 20 00 00 05', '10:00 - 23:00'),
('Cinéphoria Charleroi', 'Charleroi', 'Belgique', '10 Boulevard Tirou, 6000 Charleroi', '+32 71 00 00 06', '10:00 - 22:30'),
('Cinéphoria Liège', 'Liège', 'Belgique', '20 Place Saint-Lambert, 4000 Liège', '+32 4 00 00 07', '10:00 - 22:30');

-- Tarification par qualité
INSERT INTO quality_prices (quality, price, description) VALUES
('Standard', 9.50, 'Projection standard haute définition'),
('3D', 13.00, 'Projection en 3 dimensions avec lunettes incluses'),
('4K', 14.50, 'Projection en ultra haute définition 4K'),
('4DX', 18.00, 'Expérience immersive 4DX avec effets sensoriels'),
('IMAX', 16.00, 'Projection grand format IMAX');

-- Création des salles pour chaque cinéma
-- Cinéphoria Nantes (id=1)
INSERT INTO rooms (cinema_id, room_number, capacity, quality) VALUES
(1, 1, 120, 'Standard'),
(1, 2, 80, '3D'),
(1, 3, 60, '4K'),
-- Cinéphoria Bordeaux (id=2)
(2, 1, 150, 'Standard'),
(2, 2, 100, 'IMAX'),
(2, 3, 70, '3D'),
-- Cinéphoria Paris (id=3)
(3, 1, 200, 'Standard'),
(3, 2, 120, '4DX'),
(3, 3, 100, '4K'),
(3, 4, 80, 'IMAX'),
-- Cinéphoria Toulouse (id=4)
(4, 1, 110, 'Standard'),
(4, 2, 90, '3D'),
(4, 3, 60, '4K'),
-- Cinéphoria Lille (id=5)
(5, 1, 130, 'Standard'),
(5, 2, 85, '3D'),
(5, 3, 65, 'IMAX'),
-- Cinéphoria Charleroi (id=6)
(6, 1, 100, 'Standard'),
(6, 2, 70, '3D'),
-- Cinéphoria Liège (id=7)
(7, 1, 110, 'Standard'),
(7, 2, 75, '4K');

-- Fonction pour générer les sièges automatiquement
-- On crée les sièges pour toutes les salles
DO $$
DECLARE
    r RECORD;
    row_letter CHAR(1);
    seat_num INTEGER;
    seats_per_row INTEGER;
    total_rows INTEGER;
    current_seat INTEGER;
BEGIN
    FOR r IN SELECT id, capacity FROM rooms LOOP
        seats_per_row := 10;
        total_rows := CEIL(r.capacity::FLOAT / seats_per_row);
        current_seat := 0;
        
        FOR i IN 1..total_rows LOOP
            row_letter := CHR(64 + i); -- A, B, C, D...
            FOR j IN 1..seats_per_row LOOP
                current_seat := current_seat + 1;
                EXIT WHEN current_seat > r.capacity;
                
                INSERT INTO seats (room_id, seat_number, seat_row, is_pmr, is_available)
                VALUES (
                    r.id,
                    j,
                    row_letter,
                    -- Les 2 premiers sièges de la dernière rangée sont PMR
                    (i = total_rows AND j <= 2),
                    TRUE
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Utilisateur administrateur par défaut
-- Mot de passe : Admin@1234 (hashé avec bcrypt)
INSERT INTO users (email, password, first_name, last_name, username, role, email_verified) VALUES
('admin@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Admin', 'Cinéphoria', 'admin', 'admin', TRUE);

-- Employés par défaut (un par cinéma)
-- Mot de passe : Employe@1234
INSERT INTO users (email, password, first_name, last_name, username, role, cinema_id, email_verified) VALUES
('employe.nantes@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Jean', 'Dupont', 'jdupont', 'employee', 1, TRUE),
('employe.bordeaux@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Marie', 'Martin', 'mmartin', 'employee', 2, TRUE),
('employe.paris@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Pierre', 'Durand', 'pdurand', 'employee', 3, TRUE),
('employe.toulouse@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Sophie', 'Bernard', 'sbernard', 'employee', 4, TRUE),
('employe.lille@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Lucas', 'Petit', 'lpetit', 'employee', 5, TRUE),
('employe.charleroi@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Emma', 'Leroy', 'eleroy', 'employee', 6, TRUE),
('employe.liege@cinephoria.fr', '$2b$10$YourHashedPasswordHere', 'Thomas', 'Moreau', 'tmoreau', 'employee', 7, TRUE);

-- Utilisateur test
-- Mot de passe : User@1234
INSERT INTO users (email, password, first_name, last_name, username, role, email_verified) VALUES
('user@test.fr', '$2b$10$YourHashedPasswordHere', 'Test', 'Utilisateur', 'testuser', 'user', TRUE);

-- Films (ajoutés un mercredi)
INSERT INTO films (title, description, poster_url, min_age, is_coup_de_coeur, genre, duration, added_date) VALUES
('Le Dernier Voyage', 'Un astronaute perdu dans l''espace doit trouver le chemin du retour vers la Terre. Une odyssée spatiale époustouflante qui repousse les limites du cinéma.', '/images/films/dernier-voyage.jpg', 10, TRUE, 'Science-Fiction', 142, '2026-02-11'),
('Ombres à Paris', 'Un détective privé enquête sur une série de disparitions mystérieuses dans les rues sombres de Paris. Thriller haletant aux multiples rebondissements.', '/images/films/ombres-paris.jpg', 16, FALSE, 'Thriller', 118, '2026-02-11'),
('La Mélodie du Bonheur', 'Une comédie musicale familiale qui raconte l''histoire d''une chorale de quartier qui tente de sauver son théâtre local.', '/images/films/melodie-bonheur.jpg', 0, TRUE, 'Comédie', 96, '2026-02-11'),
('Crocs de la Nuit', 'Dans un village isolé des Carpates, une ancienne malédiction se réveille lorsqu''un groupe d''étudiants décide d''explorer un château abandonné.', '/images/films/crocs-nuit.jpg', 16, FALSE, 'Horreur', 105, '2026-02-11'),
('Les Aventuriers du Temps', 'Deux frères découvrent une machine à voyager dans le temps dans le grenier de leur grand-père. Une aventure familiale palpitante.', '/images/films/aventuriers-temps.jpg', 8, TRUE, 'Aventure', 128, '2026-02-11'),
('Cœur de Champion', 'L''histoire vraie d''un boxeur amateur qui défie toutes les attentes pour atteindre le sommet du sport professionnel.', '/images/films/coeur-champion.jpg', 12, FALSE, 'Drame', 134, '2026-02-11'),
('Planète Sauvage', 'Un documentaire immersif sur les espèces menacées qui peuplent les dernières forêts primaires de la planète.', '/images/films/planete-sauvage.jpg', 0, FALSE, 'Documentaire', 92, '2026-02-11'),
('Le Complot des Ombres', 'Un journaliste découvre un complot gouvernemental menaçant la démocratie. Course contre la montre pour révéler la vérité.', '/images/films/complot-ombres.jpg', 12, FALSE, 'Thriller', 121, '2026-02-11');

-- Séances pour les films (semaine courante)
-- Cinéphoria Paris - Salle 1 (Standard, id=7)
INSERT INTO sessions (film_id, room_id, start_time, end_time) VALUES
(1, 7, '2026-02-13 14:00', '2026-02-13 16:22'),
(1, 7, '2026-02-13 17:00', '2026-02-13 19:22'),
(1, 7, '2026-02-13 20:00', '2026-02-13 22:22'),
(2, 7, '2026-02-14 14:00', '2026-02-14 15:58'),
(2, 7, '2026-02-14 17:00', '2026-02-14 18:58'),
(3, 7, '2026-02-14 20:00', '2026-02-14 21:36'),
-- Cinéphoria Paris - Salle 2 (4DX, id=8)
(1, 8, '2026-02-13 15:00', '2026-02-13 17:22'),
(4, 8, '2026-02-13 18:00', '2026-02-13 19:45'),
(5, 8, '2026-02-13 20:30', '2026-02-13 22:38'),
(6, 8, '2026-02-14 14:00', '2026-02-14 16:14'),
-- Cinéphoria Paris - Salle 3 (4K, id=9)
(3, 9, '2026-02-13 14:00', '2026-02-13 15:36'),
(5, 9, '2026-02-13 16:00', '2026-02-13 18:08'),
(7, 9, '2026-02-13 19:00', '2026-02-13 20:32'),
(8, 9, '2026-02-13 21:00', '2026-02-13 23:01'),
-- Cinéphoria Nantes - Salle 1 (Standard, id=1)
(1, 1, '2026-02-13 14:30', '2026-02-13 16:52'),
(2, 1, '2026-02-13 17:30', '2026-02-13 19:28'),
(3, 1, '2026-02-13 20:00', '2026-02-13 21:36'),
-- Cinéphoria Nantes - Salle 2 (3D, id=2)
(4, 2, '2026-02-13 15:00', '2026-02-13 16:45'),
(5, 2, '2026-02-13 17:30', '2026-02-13 19:38'),
(6, 2, '2026-02-13 20:30', '2026-02-13 22:44'),
-- Cinéphoria Bordeaux - Salle 1 (Standard, id=4)
(1, 4, '2026-02-13 14:00', '2026-02-13 16:22'),
(3, 4, '2026-02-13 17:00', '2026-02-13 18:36'),
(8, 4, '2026-02-13 19:30', '2026-02-13 21:31'),
-- Cinéphoria Bordeaux - Salle 2 (IMAX, id=5)
(1, 5, '2026-02-13 15:00', '2026-02-13 17:22'),
(5, 5, '2026-02-13 18:00', '2026-02-13 20:08'),
(6, 5, '2026-02-13 21:00', '2026-02-13 23:14');
