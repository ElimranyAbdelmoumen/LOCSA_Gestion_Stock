-- =============================================================
-- FIX: Migration FES → MEKNES
-- Problème : Hibernate ne peut pas modifier les CHECK constraints
--            existantes avec ddl-auto=update.
--            La DB refuse l'insertion de 'MEKNES' car la contrainte
--            autorise encore uniquement 'FES', 'TANGER', 'CASABLANCA'.
--
-- À exécuter sur la base PostgreSQL (locsa_db) une seule fois.
-- =============================================================

BEGIN;

-- ---------------------------------------------------------------
-- 1. Supprimer les anciennes CHECK constraints (contenant 'FES')
--    sur toutes les tables qui utilisent la colonne city
-- ---------------------------------------------------------------

DO $$
DECLARE
    r RECORD;
    tables TEXT[] := ARRAY['sites', 'users', 'audit_log', 'inventory', 'stock_entries', 'stock_exits'];
    t TEXT;
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        FOR r IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = t::regclass
              AND contype = 'c'
              AND pg_get_constraintdef(oid) LIKE '%FES%'
        LOOP
            RAISE NOTICE 'Suppression contrainte: % sur table: %', r.conname, t;
            EXECUTE 'ALTER TABLE ' || quote_ident(t) || ' DROP CONSTRAINT ' || quote_ident(r.conname);
        END LOOP;
    END LOOP;
END $$;

-- ---------------------------------------------------------------
-- 2. Mettre à jour les enregistrements existants FES → MEKNES
-- ---------------------------------------------------------------

UPDATE sites        SET city = 'MEKNES' WHERE city = 'FES';
UPDATE users        SET city = 'MEKNES' WHERE city = 'FES';
UPDATE audit_log    SET city = 'MEKNES' WHERE city = 'FES';
UPDATE inventory    SET city = 'MEKNES' WHERE city = 'FES';
UPDATE stock_entries SET city = 'MEKNES' WHERE city = 'FES';
UPDATE stock_exits  SET city = 'MEKNES' WHERE city = 'FES';

-- ---------------------------------------------------------------
-- 3. Ajouter les nouvelles CHECK constraints correctes (MEKNES)
-- ---------------------------------------------------------------

ALTER TABLE sites
    ADD CONSTRAINT sites_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

ALTER TABLE users
    ADD CONSTRAINT users_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

ALTER TABLE audit_log
    ADD CONSTRAINT audit_log_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

ALTER TABLE inventory
    ADD CONSTRAINT inventory_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

ALTER TABLE stock_entries
    ADD CONSTRAINT stock_entries_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

ALTER TABLE stock_exits
    ADD CONSTRAINT stock_exits_city_check
    CHECK (city IN ('TANGER', 'MEKNES', 'CASABLANCA'));

COMMIT;

-- Vérification finale
SELECT 'sites'        AS table_name, city, count(*) FROM sites        GROUP BY city
UNION ALL
SELECT 'users'        AS table_name, city, count(*) FROM users        GROUP BY city
UNION ALL
SELECT 'inventory'    AS table_name, city, count(*) FROM inventory    GROUP BY city
ORDER BY table_name, city;
