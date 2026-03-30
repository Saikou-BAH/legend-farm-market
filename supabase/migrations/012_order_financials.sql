-- Migration 012 — Financiers commande + bandes flexibles
--
-- 1. flock_batches.product_id devient nullable (une bande peut couvrir
--    plusieurs produits — le produit est précisé sur chaque stock_entry)
-- 2. flock_batches.initial_quantity autorise 0 (quantité non encore connue
--    à la création de la bande)
-- 3. orders.admin_discount : réduction supplémentaire décidée par l'admin
--    (en plus du discount_amount issu des promotions checkout)

-- ── 1. flock_batches : product_id optionnel ───────────────────────────────────
ALTER TABLE flock_batches
  ALTER COLUMN product_id DROP NOT NULL;

-- ── 2. flock_batches : initial_quantity peut valoir 0 ────────────────────────
-- Supprimer l'ancienne contrainte CHECK (initial_quantity > 0)
ALTER TABLE flock_batches
  DROP CONSTRAINT IF EXISTS flock_batches_initial_quantity_check;

-- Ré-appliquer avec >= 0
ALTER TABLE flock_batches
  ADD CONSTRAINT flock_batches_initial_quantity_check
    CHECK (initial_quantity >= 0);

-- Même chose pour remaining_quantity (elle est déjà >= 0 mais on s'assure
-- que la contrainte de cohérence restante tient)
ALTER TABLE flock_batches
  DROP CONSTRAINT IF EXISTS flock_batch_remaining_lte_initial;

ALTER TABLE flock_batches
  ADD CONSTRAINT flock_batch_remaining_lte_initial
    CHECK (remaining_quantity <= initial_quantity);

-- ── 3. orders.admin_discount — réduction admin post-checkout ─────────────────
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS admin_discount NUMERIC(15, 2) NOT NULL DEFAULT 0
    CHECK (admin_discount >= 0);

COMMENT ON COLUMN orders.admin_discount IS
  'Réduction supplémentaire accordée par l''admin après la commande initiale '
  '(s''ajoute au discount_amount issu des promotions). '
  'total_amount = subtotal - discount_amount - admin_discount + delivery_fee';

COMMENT ON COLUMN flock_batches.product_id IS
  'Produit principal de la bande (optionnel). '
  'Le produit est précisé sur chaque stock_entry individuelle.';
