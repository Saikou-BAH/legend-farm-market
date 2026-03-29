-- Migration 009 — Correctifs données produits
-- À exécuter dans le SQL Editor Supabase (ou via supabase db push).
--
-- Problèmes corrigés :
-- 1. "Casier d''oeufs de 30" → "Casier d'œufs de 30"  (double apostrophe SQL + accent)
-- 2. Prix poulets réformés à 1 GNF → marqué indisponible + prix réaliste à confirmer
-- 3. Harmonisation des champs unit pour cohérence

-- ── 1. Corriger le nom et l'unité du casier d'œufs ───────────────────────────
-- La double apostrophe vient d'un INSERT SQL mal échappé.
UPDATE products
SET
  name        = 'Casier d''œufs de 30',
  description = COALESCE(
    NULLIF(description, ''),
    'Casier de 30 œufs frais ramassés à la ferme. Date de ponte connue, fraîcheur garantie.'
  ),
  updated_at  = NOW()
WHERE name ILIKE '%casier%oeufs%'
   OR name ILIKE '%casier%oeuf%'
   OR name = 'Casier d''oeufs de 30';

-- ── 2. Corriger le prix des poulets réformés ──────────────────────────────────
-- Un prix à 1 GNF indique clairement une donnée de test mal migrée.
-- On ne peut pas fixer un vrai prix sans confirmation.
-- Action : on marque availability_status = 'unavailable' pour masquer le produit
-- publiquement, et on note dans restock_note la raison.
-- Le prix doit être corrigé manuellement depuis l'admin produit avant remise en vente.
UPDATE products
SET
  availability_status = 'unavailable',
  restock_note        = 'Prix en cours de mise à jour — contactez la ferme pour disponibilité.',
  updated_at          = NOW()
WHERE
  (name ILIKE '%poulet%' OR name ILIKE '%volaille%')
  AND base_price < 500;

-- Si vous souhaitez plutôt fixer directement un prix réaliste (ex : 25 000 GNF),
-- décommentez et adaptez la ligne ci-dessous :
--
-- UPDATE products
-- SET
--   base_price          = 25000,
--   availability_status = 'available',
--   restock_note        = NULL,
--   updated_at          = NOW()
-- WHERE name ILIKE '%poulet%' AND base_price < 500;

-- ── 3. Harmoniser l'unité des sacs de fiente ─────────────────────────────────
UPDATE products
SET
  unit       = 'sac',
  updated_at = NOW()
WHERE (name ILIKE '%fiente%' OR name ILIKE '%fumier%')
  AND unit NOT IN ('sac', 'kg');

-- ── 4. Vérification post-migration ───────────────────────────────────────────
-- Exécutez cette requête pour vérifier les résultats :
--
-- SELECT id, name, base_price, unit, availability_status, restock_note
-- FROM products
-- ORDER BY name;
