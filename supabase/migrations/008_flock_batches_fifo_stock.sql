-- Migration 008 — Bandes (flock batches) + FIFO stock tracking
-- Introduces traceability for chicken flocks and egg production runs.
-- stock_entries records when stock is received; stock_movements records
-- consumption (FIFO) linked to order items.

-- ── 1. Status enum for flock batches ─────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE flock_batch_status AS ENUM ('active', 'depleted', 'archived');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. flock_batches — physical production lots / bandes ─────────────────────
CREATE TABLE IF NOT EXISTS flock_batches (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  name            TEXT        NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  batch_date      DATE        NOT NULL,               -- date d'acquisition / entrée en production
  initial_quantity INTEGER    NOT NULL CHECK (initial_quantity > 0),
  remaining_quantity INTEGER  NOT NULL CHECK (remaining_quantity >= 0),
  cost_per_unit   NUMERIC(15, 2),                     -- coût d'achat ou de production unitaire
  status          flock_batch_status NOT NULL DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT flock_batch_remaining_lte_initial
    CHECK (remaining_quantity <= initial_quantity)
);

CREATE INDEX IF NOT EXISTS idx_flock_batches_product_id
  ON flock_batches (product_id);

CREATE INDEX IF NOT EXISTS idx_flock_batches_status_date
  ON flock_batches (status, batch_date);

-- ── 3. stock_entries — entrées de stock liées à une bande ────────────────────
CREATE TABLE IF NOT EXISTS stock_entries (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id       UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  flock_batch_id   UUID        REFERENCES flock_batches(id) ON DELETE SET NULL,
  quantity         INTEGER     NOT NULL CHECK (quantity > 0),
  remaining_qty    INTEGER     NOT NULL CHECK (remaining_qty >= 0),  -- quantité encore disponible (FIFO)
  unit_cost        NUMERIC(15, 2),
  notes            TEXT,
  entered_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entered_by       UUID        REFERENCES staff_profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_entry_remaining_lte_qty
    CHECK (remaining_qty <= quantity)
);

CREATE INDEX IF NOT EXISTS idx_stock_entries_product_id
  ON stock_entries (product_id);

CREATE INDEX IF NOT EXISTS idx_stock_entries_fifo
  ON stock_entries (product_id, entered_at)
  WHERE remaining_qty > 0;

-- ── 4. stock_movements — consommation FIFO liée aux commandes ─────────────────
CREATE TABLE IF NOT EXISTS stock_movements (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id          UUID        NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  stock_entry_id      UUID        NOT NULL REFERENCES stock_entries(id) ON DELETE RESTRICT,
  order_item_id       UUID        REFERENCES order_items(id) ON DELETE SET NULL,
  quantity_consumed   INTEGER     NOT NULL CHECK (quantity_consumed > 0),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id
  ON stock_movements (product_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_order_item_id
  ON stock_movements (order_item_id);

CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_entry_id
  ON stock_movements (stock_entry_id);

-- ── 5. Trigger: decrement stock_entries.remaining_qty on movement insert ──────
CREATE OR REPLACE FUNCTION decrement_stock_entry_on_movement()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE stock_entries
  SET remaining_qty = remaining_qty - NEW.quantity_consumed
  WHERE id = NEW.stock_entry_id;

  -- Mark batch depleted when all its entries are exhausted
  UPDATE flock_batches fb
  SET
    remaining_quantity = (
      SELECT COALESCE(SUM(se.remaining_qty), 0)
      FROM stock_entries se
      WHERE se.flock_batch_id = fb.id
    ),
    status = CASE
      WHEN (
        SELECT COALESCE(SUM(se.remaining_qty), 0)
        FROM stock_entries se
        WHERE se.flock_batch_id = fb.id
      ) = 0 THEN 'depleted'::flock_batch_status
      ELSE fb.status
    END,
    updated_at = NOW()
  WHERE fb.id = (
    SELECT flock_batch_id FROM stock_entries WHERE id = NEW.stock_entry_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock_entry ON stock_movements;
CREATE TRIGGER trg_decrement_stock_entry
  AFTER INSERT ON stock_movements
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_entry_on_movement();

-- ── 6. Trigger: update updated_at on flock_batches ───────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_flock_batches_updated_at ON flock_batches;
CREATE TRIGGER trg_flock_batches_updated_at
  BEFORE UPDATE ON flock_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 7. RLS policies ──────────────────────────────────────────────────────────

-- flock_batches: staff full access, public read-only (for stats display)
ALTER TABLE flock_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flock_batches_staff_all" ON flock_batches
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  );

-- stock_entries: staff only
ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_entries_staff_all" ON stock_entries
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  );

-- stock_movements: staff only
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stock_movements_staff_all" ON stock_movements
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' -> 'legend_farm' ->> 'user_type') = 'staff'
  );
