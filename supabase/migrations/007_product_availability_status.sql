-- Migration 007 — Product availability status
-- Adds a rich availability_status field to products, replacing the simple
-- is_available boolean with a four-state enum while keeping full backward
-- compatibility.

-- ── 1. Add the enum type ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE product_availability_status AS ENUM (
    'available',
    'out_of_stock',
    'unavailable',
    'coming_soon'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Add columns to products ───────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS availability_status product_availability_status
    NOT NULL DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS availability_label  TEXT CHECK (char_length(availability_label) <= 60),
  ADD COLUMN IF NOT EXISTS restock_note        TEXT CHECK (char_length(restock_note) <= 120);

-- ── 3. Backfill from existing is_available ───────────────────────────────────
-- Products that were is_available = false become 'unavailable'.
-- Products with is_available = true and stock_quantity = 0 become 'out_of_stock'.
-- Everything else stays 'available'.
UPDATE products
SET availability_status = 'unavailable'
WHERE is_available = false
  AND availability_status = 'available';

UPDATE products
SET availability_status = 'out_of_stock'
WHERE is_available = true
  AND stock_quantity = 0
  AND availability_status = 'available';

-- ── 4. Index for catalogue filtering ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_availability_status
  ON products (availability_status);

-- ── 5. RLS — no change needed (existing policies cover all product columns) ──
