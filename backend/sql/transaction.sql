-- ╔══════════════════════════════════════════════════════════════════╗
-- ║           CINÉPHORIA - TRANSACTION SQL DE RÉSERVATION           ║
-- ╚══════════════════════════════════════════════════════════════════╝
--
-- OBJECTIF :
-- Cette transaction gère le processus COMPLET de réservation de billets
-- de cinéma de manière ATOMIQUE : soit toutes les opérations réussissent
-- (COMMIT), soit aucune modification n'est appliquée (ROLLBACK).
--
-- PRINCIPE D'ATOMICITÉ :
-- Une transaction SQL est un ensemble de requêtes qui forme une unité
-- indivisible. C'est le "tout ou rien" : si l'INSERT de la réservation
-- réussit mais que l'UPDATE des sièges échoue, alors TOUT est annulé,
-- y compris l'INSERT. Cela garantit la cohérence des données.
--
-- PROBLÈME RÉSOLU :
-- Sans transaction, deux utilisateurs pourraient simultanément voir
-- les mêmes sièges comme disponibles, réserver en parallèle, et
-- créer un surbooking. Le verrouillage pessimiste (FOR UPDATE) et
-- le niveau d'isolation SERIALIZABLE empêchent ce scénario.
--
-- FLUX :
-- BEGIN → Verrou séance → Verrou sièges → Vérifications (x4)
--       → INSERT réservation → INSERT liaison sièges
--       → UPDATE sièges réservés → COMMIT
--       → ROLLBACK automatique si erreur à n'importe quelle étape
-- ====================================================================


-- ====================================================================
-- TRANSACTION PRINCIPALE : Réservation complète
-- ====================================================================

BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- SERIALIZABLE = niveau d'isolation le plus strict.
-- PostgreSQL détecte les conflits de lecture/écriture entre transactions
-- concurrentes et lève une erreur 40001 si un conflit est détecté.

DO $$
DECLARE
    -- ── Paramètres d'entrée (simulant la requête API) ──
    v_session_id   INTEGER := 1;              -- Séance choisie par le client
    v_user_id      INTEGER := 9;              -- Utilisateur authentifié
    v_seat_ids     INTEGER[] := ARRAY[1,2,3]; -- 3 sièges sélectionnés

    -- ── Variables de travail ──
    v_room_id         INTEGER;
    v_quality         VARCHAR(50);
    v_capacity        INTEGER;
    v_price           DECIMAL(6,2);
    v_total_price     DECIMAL(8,2);
    v_num_seats       INTEGER;
    v_booked_count    INTEGER;
    v_unavailable     INTEGER;
    v_already_booked  INTEGER;
    v_seat_check      INTEGER;
    v_reservation_id  INTEGER;
    v_seat_id         INTEGER;
BEGIN
    v_num_seats := array_length(v_seat_ids, 1);

    -- ════════════════════════════════════════════
    -- ÉTAPE 1 : VERROUILLER LA SÉANCE (FOR UPDATE)
    -- ════════════════════════════════════════════
    -- FOR UPDATE pose un verrou exclusif sur la ligne.
    -- Toute autre transaction qui tente un FOR UPDATE
    -- sur la MÊME séance sera BLOQUÉE ici jusqu'au
    -- COMMIT ou ROLLBACK de la transaction courante.
    -- → Sérialise les réservations concurrentes.

    SELECT s.room_id, r.quality, r.capacity
    INTO v_room_id, v_quality, v_capacity
    FROM sessions s
    JOIN rooms r ON r.id = s.room_id
    WHERE s.id = v_session_id
      AND s.start_time > NOW()
    FOR UPDATE OF s;

    IF NOT FOUND THEN
        -- La séance n'existe pas ou est déjà passée → ROLLBACK implicite
        RAISE EXCEPTION 'ERREUR : Séance #% introuvable ou déjà passée', v_session_id;
    END IF;

    -- Récupérer le tarif de la qualité de projection
    SELECT price INTO v_price
    FROM quality_prices
    WHERE quality = v_quality;

    -- Calculer le prix total : prix unitaire × nombre de sièges
    v_total_price := v_price * v_num_seats;

    -- ════════════════════════════════════════════
    -- ÉTAPE 2 : VERROUILLER LES SIÈGES (FOR UPDATE)
    -- ════════════════════════════════════════════
    -- Verrouillage pessimiste de chaque siège demandé.
    -- Empêche qu'un autre processus modifie ces sièges
    -- (ex: un employé qui désactive un siège pour incident)
    -- pendant que la réservation est en cours.

    PERFORM id FROM seats
    WHERE id = ANY(v_seat_ids)
      AND room_id = v_room_id
    FOR UPDATE;

    -- ════════════════════════════════════════════
    -- ÉTAPE 3 : VÉRIFICATION - Sièges existent dans la salle
    -- ════════════════════════════════════════════

    SELECT COUNT(*) INTO v_seat_check
    FROM seats
    WHERE id = ANY(v_seat_ids)
      AND room_id = v_room_id;

    IF v_seat_check != v_num_seats THEN
        RAISE EXCEPTION 'ERREUR : % siège(s) sur % n''appartiennent pas à la salle de cette séance',
            v_num_seats - v_seat_check, v_num_seats;
    END IF;

    -- ════════════════════════════════════════════
    -- ÉTAPE 4 : VÉRIFICATION - Sièges physiquement disponibles
    -- ════════════════════════════════════════════
    -- Un siège peut être marqué is_available = FALSE par un employé
    -- (siège cassé, incident signalé via l'application bureautique)

    SELECT COUNT(*) INTO v_unavailable
    FROM seats
    WHERE id = ANY(v_seat_ids)
      AND is_available = FALSE;

    IF v_unavailable > 0 THEN
        RAISE EXCEPTION 'ERREUR : % siège(s) hors service (maintenance/incident)', v_unavailable;
    END IF;

    -- ════════════════════════════════════════════
    -- ÉTAPE 5 : VÉRIFICATION - Pas de double réservation
    -- ════════════════════════════════════════════
    -- Vérifie qu'aucun des sièges demandés n'est déjà réservé
    -- pour cette séance par une réservation active (confirmée ou en attente).
    -- C'est LA vérification critique anti-surbooking.

    SELECT COUNT(*) INTO v_already_booked
    FROM reservation_seats rs
    JOIN reservations res ON res.id = rs.reservation_id
    WHERE res.session_id = v_session_id
      AND res.status IN ('confirmed', 'pending')
      AND rs.seat_id = ANY(v_seat_ids);

    IF v_already_booked > 0 THEN
        RAISE EXCEPTION 'SURBOOKING BLOQUÉ : % siège(s) déjà réservé(s) pour la séance #%',
            v_already_booked, v_session_id;
    END IF;

    -- ════════════════════════════════════════════
    -- ÉTAPE 6 : VÉRIFICATION - Capacité de la salle
    -- ════════════════════════════════════════════
    -- Même si les sièges individuels sont libres, on vérifie
    -- que la capacité GLOBALE de la salle n'est pas dépassée.

    SELECT COALESCE(SUM(res.num_seats), 0) INTO v_booked_count
    FROM reservations res
    WHERE res.session_id = v_session_id
      AND res.status IN ('confirmed', 'pending');

    IF v_booked_count + v_num_seats > v_capacity THEN
        RAISE EXCEPTION 'CAPACITÉ DÉPASSÉE : % réservés + % demandés > % places max',
            v_booked_count, v_num_seats, v_capacity;
    END IF;

    -- ════════════════════════════════════════════
    -- ÉTAPE 7 : INSERT - Créer la réservation
    -- ════════════════════════════════════════════

    INSERT INTO reservations (user_id, session_id, total_price, num_seats, status)
    VALUES (v_user_id, v_session_id, v_total_price, v_num_seats, 'confirmed')
    RETURNING id INTO v_reservation_id;

    -- ════════════════════════════════════════════
    -- ÉTAPE 8 : INSERT - Associer chaque siège à la réservation
    -- ════════════════════════════════════════════
    -- Le trigger trg_no_double_booking (défini dans create_tables.sql)
    -- vérifie CHAQUE insertion comme filet de sécurité supplémentaire.

    FOREACH v_seat_id IN ARRAY v_seat_ids LOOP
        INSERT INTO reservation_seats (reservation_id, seat_id)
        VALUES (v_reservation_id, v_seat_id);
    END LOOP;

    -- ════════════════════════════════════════════
    -- ÉTAPE 9 : UPDATE - Marquer les sièges comme réservés
    -- ════════════════════════════════════════════
    -- Met à jour le statut des sièges dans la table seats.
    -- Bien que la disponibilité soit aussi calculée dynamiquement
    -- via reservation_seats, cette mise à jour garantit la cohérence
    -- et permet aux requêtes de listing d'être plus performantes
    -- (pas besoin de sous-requête pour savoir si un siège est pris).

    UPDATE seats
    SET is_available = FALSE
    WHERE id = ANY(v_seat_ids);

    -- ════════════════════════════════════════════
    -- SUCCÈS : Afficher le récapitulatif
    -- ════════════════════════════════════════════

    RAISE NOTICE '──────────────────────────────────────';
    RAISE NOTICE 'RÉSERVATION #% CONFIRMÉE', v_reservation_id;
    RAISE NOTICE 'Utilisateur : #%', v_user_id;
    RAISE NOTICE 'Séance      : #%', v_session_id;
    RAISE NOTICE 'Sièges      : % (%)', v_num_seats, v_seat_ids;
    RAISE NOTICE 'Qualité     : %', v_quality;
    RAISE NOTICE 'Prix total  : % €', v_total_price;
    RAISE NOTICE '──────────────────────────────────────';

    -- Si on arrive ici sans erreur, le COMMIT sera exécuté après le bloc DO.
    -- Si une EXCEPTION est levée, PostgreSQL exécute ROLLBACK automatiquement.
END $$;

-- ====================================================================
-- COMMIT : Valider toutes les opérations
-- ====================================================================
-- À ce stade, les 3 écritures (INSERT reservations, INSERT reservation_seats,
-- UPDATE seats) sont toutes validées de manière atomique.
-- Si PostgreSQL crashe entre le DO $$ et ce COMMIT, rien n'est persisté.
COMMIT;


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║         EXEMPLE DE ROLLBACK : Réservation qui échoue            ║
-- ╚══════════════════════════════════════════════════════════════════╝
-- Ce second exemple montre le comportement quand une vérification échoue.
-- Le ROLLBACK annule TOUT : aucune ligne n'est insérée ni modifiée.

BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

DO $$
DECLARE
    v_session_id   INTEGER := 1;
    v_user_id      INTEGER := 9;
    v_seat_ids     INTEGER[] := ARRAY[1,2,3]; -- Mêmes sièges que ci-dessus
    v_already_booked INTEGER;
BEGIN
    -- On tente de réserver les mêmes sièges, déjà pris par la transaction précédente

    SELECT COUNT(*) INTO v_already_booked
    FROM reservation_seats rs
    JOIN reservations res ON res.id = rs.reservation_id
    WHERE res.session_id = v_session_id
      AND res.status IN ('confirmed', 'pending')
      AND rs.seat_id = ANY(v_seat_ids);

    IF v_already_booked > 0 THEN
        -- ════════════════════════════════════════
        -- ROLLBACK : Les sièges sont déjà pris
        -- ════════════════════════════════════════
        -- RAISE EXCEPTION provoque un ROLLBACK automatique.
        -- Aucune des opérations de cette transaction n'est persistée.
        -- La base de données reste dans son état précédent.
        RAISE EXCEPTION 'ROLLBACK → % siège(s) déjà réservé(s). Aucune modification effectuée.',
            v_already_booked;
    END IF;

    -- Ce code n'est jamais atteint si l'exception est levée
    INSERT INTO reservations (user_id, session_id, total_price, num_seats, status)
    VALUES (v_user_id, v_session_id, 0, 3, 'confirmed');

END $$;

-- Ce COMMIT n'est jamais atteint si RAISE EXCEPTION a été exécuté.
-- PostgreSQL a déjà fait ROLLBACK automatiquement.
COMMIT;

-- ====================================================================
-- RÉSUMÉ POUR LE JURY
-- ====================================================================
--
-- TRANSACTION = ensemble de requêtes SQL : TOUT est effectué, ou RIEN.
--
-- ┌─────────────────────────────────────────────────────────────────┐
-- │  BEGIN                                                         │
-- │  ├── FOR UPDATE séance      → verrouillage anti-concurrence   │
-- │  ├── FOR UPDATE sièges      → verrouillage des lignes         │
-- │  ├── SELECT vérification 1  → sièges dans la bonne salle      │
-- │  ├── SELECT vérification 2  → sièges physiquement dispo       │
-- │  ├── SELECT vérification 3  → pas de double réservation       │
-- │  ├── SELECT vérification 4  → capacité salle non dépassée     │
-- │  ├── INSERT reservations    → créer la réservation             │
-- │  ├── INSERT reservation_seats → lier les sièges                │
-- │  ├── UPDATE seats           → marquer sièges réservés          │
-- │  └── COMMIT ✓  ou  ROLLBACK ✗                                 │
-- └─────────────────────────────────────────────────────────────────┘
--
-- Protection anti-surbooking en 4 couches :
-- 1. FOR UPDATE       → verrou pessimiste (sérialisation)
-- 2. SERIALIZABLE     → détection de conflits par PostgreSQL
-- 3. Vérifications    → logique métier (4 contrôles)
-- 4. Trigger BDD      → filet de sécurité (trg_no_double_booking)
