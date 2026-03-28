-- =============================================================
-- Legend Farm Shop - Foundation schema
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- Reference sequences
-- =============================================================

CREATE TABLE IF NOT EXISTS shop_reference_sequences (
  prefix TEXT NOT NULL,
  seq_year INTEGER NOT NULL,
  current_value BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (prefix, seq_year)
);

-- =============================================================
-- Staff and administration
-- =============================================================

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'manager', 'support', 'logistics')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Customers
-- =============================================================

CREATE TABLE IF NOT EXISTS customer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  customer_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (customer_type IN ('individual', 'retailer', 'restaurant', 'wholesaler', 'hotel')),
  loyalty_points INTEGER NOT NULL DEFAULT 500,
  loyalty_level TEXT NOT NULL DEFAULT 'bronze'
    CHECK (loyalty_level IN ('bronze', 'silver', 'gold', 'platinum')),
  credit_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0,
  is_blacklisted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT,
  full_address TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  phone TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Delivery
-- =============================================================

CREATE TABLE IF NOT EXISTS delivery_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  zones TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  delivery_fee NUMERIC(15, 2) NOT NULL CHECK (delivery_fee >= 0),
  min_order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  estimated_delay TEXT,
  available_slots TEXT[],
  available_days TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- =============================================================
-- Catalog
-- =============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  base_price NUMERIC(15, 2) NOT NULL CHECK (base_price >= 0),
  price_tier_1_qty INTEGER CHECK (price_tier_1_qty IS NULL OR price_tier_1_qty > 0),
  price_tier_1_price NUMERIC(15, 2) CHECK (price_tier_1_price IS NULL OR price_tier_1_price >= 0),
  price_tier_2_qty INTEGER CHECK (price_tier_2_qty IS NULL OR price_tier_2_qty > 0),
  price_tier_2_price NUMERIC(15, 2) CHECK (price_tier_2_price IS NULL OR price_tier_2_price >= 0),
  price_tier_3_qty INTEGER CHECK (price_tier_3_qty IS NULL OR price_tier_3_qty > 0),
  price_tier_3_price NUMERIC(15, 2) CHECK (price_tier_3_price IS NULL OR price_tier_3_price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  stock_alert_threshold INTEGER NOT NULL DEFAULT 10 CHECK (stock_alert_threshold >= 0),
  is_available BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Promotions
-- =============================================================

CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL
    CHECK (type IN ('percentage', 'fixed_amount', 'free_delivery', 'buy_x_get_y', 'bundle')),
  code TEXT UNIQUE,
  value NUMERIC(10, 2) NOT NULL CHECK (value >= 0),
  min_order_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (min_order_amount >= 0),
  max_uses INTEGER CHECK (max_uses IS NULL OR max_uses >= 0),
  max_uses_per_customer INTEGER NOT NULL DEFAULT 1 CHECK (max_uses_per_customer >= 0),
  current_uses INTEGER NOT NULL DEFAULT 0 CHECK (current_uses >= 0),
  customer_types TEXT[],
  customer_levels TEXT[],
  product_ids UUID[],
  zones TEXT[],
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_cumulative BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Orders
-- =============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'returned')),
  delivery_type TEXT NOT NULL DEFAULT 'delivery'
    CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address_id UUID REFERENCES customer_addresses(id) ON DELETE SET NULL,
  delivery_zone TEXT,
  delivery_date DATE,
  delivery_slot TEXT,
  delivery_instructions TEXT,
  delivery_person_id UUID REFERENCES delivery_persons(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ,
  payment_method TEXT
    CHECK (payment_method IN ('orange_money', 'mtn_money', 'bank_transfer', 'cash_on_delivery', 'account_credit', 'loyalty_points')),
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  paid_at TIMESTAMPTZ,
  subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  delivery_fee NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
  points_used INTEGER NOT NULL DEFAULT 0 CHECK (points_used >= 0),
  points_earned INTEGER NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  promo_code TEXT,
  promo_id UUID REFERENCES promotions(id) ON DELETE SET NULL,
  customer_notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  inventory_reserved_at TIMESTAMPTZ,
  inventory_released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_unit TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
  alveoles_quantity INTEGER NOT NULL DEFAULT 0 CHECK (alveoles_quantity >= 0),
  alveoles_option TEXT NOT NULL DEFAULT 'customer_brings'
    CHECK (alveoles_option IN ('customer_brings', 'farm_provides', 'invoiced')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Returns
-- =============================================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reason TEXT NOT NULL
    CHECK (reason IN ('defective', 'poor_quality', 'wrong_order', 'wrong_quantity', 'other')),
  reason_details TEXT,
  resolution TEXT
    CHECK (resolution IN ('refund', 'credit', 'exchange')),
  refund_amount NUMERIC(15, 2) CHECK (refund_amount IS NULL OR refund_amount >= 0),
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT
);

-- =============================================================
-- Loyalty and reviews
-- =============================================================

CREATE TABLE IF NOT EXISTS promo_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC(15, 2) NOT NULL CHECK (discount_applied >= 0),
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('earned_purchase', 'earned_signup', 'earned_birthday', 'earned_referral', 'earned_review', 'redeemed', 'expired', 'admin_adjustment')),
  points INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  description TEXT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  is_published BOOLEAN NOT NULL DEFAULT false,
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Marketing and operations
-- =============================================================

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  content_html TEXT NOT NULL,
  segment TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipients_count INTEGER NOT NULL DEFAULT 0 CHECK (recipients_count >= 0),
  opens_count INTEGER NOT NULL DEFAULT 0 CHECK (opens_count >= 0),
  clicks_count INTEGER NOT NULL DEFAULT 0 CHECK (clicks_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  customer_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  total_amount NUMERIC(15, 2) CHECK (total_amount IS NULL OR total_amount >= 0),
  reminder_1_sent_at TIMESTAMPTZ,
  reminder_2_sent_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO shop_settings (key, value, description) VALUES
  ('shop_name', 'Legend Farm Shop', 'Nom de la boutique'),
  ('shop_email', 'contact@legendfarm.gn', 'Email de contact'),
  ('shop_phone', '+224 XX XX XX XX', 'Telephone'),
  ('shop_address', 'Conakry, Guinee', 'Adresse'),
  ('loyalty_points_rate', '1', 'Points par GNF depense'),
  ('loyalty_silver_threshold', '10000', 'Seuil niveau Argent'),
  ('loyalty_gold_threshold', '50000', 'Seuil niveau Or'),
  ('loyalty_platinum_threshold', '100000', 'Seuil niveau Platine'),
  ('welcome_points', '500', 'Points offerts a l inscription'),
  ('min_order_amount', '0', 'Minimum de commande global'),
  ('abandoned_cart_reminder_1_hours', '24', 'Delai relance panier 1'),
  ('abandoned_cart_reminder_2_hours', '72', 'Delai relance panier 2')
ON CONFLICT (key) DO NOTHING;

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_customer_profiles_type ON customer_profiles(customer_type);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_loyalty_level ON customer_profiles(loyalty_level);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_blacklist ON customer_profiles(is_blacklisted);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_role_active ON staff_profiles(role, is_active);

CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer ON customer_addresses(customer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default
  ON customer_addresses(customer_id)
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available_sort ON products(is_available, sort_order);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_low_stock
  ON products(stock_quantity, stock_alert_threshold)
  WHERE is_available = true;

CREATE INDEX IF NOT EXISTS idx_promotions_active_window ON promotions(is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person ON orders(delivery_person_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo ON orders(promo_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_status ON returns(customer_id, status);

CREATE INDEX IF NOT EXISTS idx_promo_usages_promo_customer ON promo_usages(promo_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_customer_created ON loyalty_transactions(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_published ON product_reviews(product_id, is_published);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status_schedule ON email_campaigns(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_city_active ON delivery_zones(city, is_active);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_product ON stock_notifications(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_email ON stock_notifications(customer_email);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_customer_updated ON abandoned_carts(customer_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_email ON abandoned_carts(customer_email);

-- =============================================================
-- Helpers and triggers
-- =============================================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_shop_setting_int(setting_key TEXT, fallback_value INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  raw_value TEXT;
BEGIN
  SELECT value INTO raw_value
  FROM shop_settings
  WHERE key = setting_key;

  RETURN COALESCE(NULLIF(raw_value, '')::INTEGER, fallback_value);
EXCEPTION
  WHEN others THEN
    RETURN fallback_value;
END;
$$;

CREATE OR REPLACE FUNCTION next_shop_reference(prefix_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  next_value BIGINT;
BEGIN
  INSERT INTO shop_reference_sequences (prefix, seq_year, current_value)
  VALUES (prefix_value, current_year, 1)
  ON CONFLICT (prefix, seq_year)
  DO UPDATE SET current_value = shop_reference_sequences.current_value + 1
  RETURNING current_value INTO next_value;

  RETURN FORMAT('%s-%s-%s', prefix_value, current_year, LPAD(next_value::TEXT, 5, '0'));
END;
$$;

CREATE OR REPLACE FUNCTION set_order_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference IS NULL OR BTRIM(NEW.reference) = '' THEN
    NEW.reference := next_shop_reference('LFS');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_return_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference IS NULL OR BTRIM(NEW.reference) = '' THEN
    NEW.reference := next_shop_reference('RET');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_single_default_address()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_default THEN
    UPDATE customer_addresses
    SET is_default = false
    WHERE customer_id = NEW.customer_id
      AND id <> COALESCE(NEW.id, gen_random_uuid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_customer_loyalty_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  silver_threshold INTEGER;
  gold_threshold INTEGER;
  platinum_threshold INTEGER;
BEGIN
  silver_threshold := get_shop_setting_int('loyalty_silver_threshold', 10000);
  gold_threshold := get_shop_setting_int('loyalty_gold_threshold', 50000);
  platinum_threshold := get_shop_setting_int('loyalty_platinum_threshold', 100000);

  NEW.loyalty_level := CASE
    WHEN NEW.loyalty_points >= platinum_threshold THEN 'platinum'
    WHEN NEW.loyalty_points >= gold_threshold THEN 'gold'
    WHEN NEW.loyalty_points >= silver_threshold THEN 'silver'
    ELSE 'bronze'
  END;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_customer_points_from_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE customer_profiles
  SET loyalty_points = NEW.balance_after
  WHERE id = NEW.customer_id;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_order_inventory()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item RECORD;
  touched_rows INTEGER;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF NEW.status IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
     AND COALESCE(OLD.status, '') NOT IN ('confirmed', 'preparing', 'out_for_delivery', 'delivered')
     AND OLD.inventory_reserved_at IS NULL THEN
    FOR item IN
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      IF item.product_id IS NULL THEN
        CONTINUE;
      END IF;

      UPDATE products
      SET stock_quantity = stock_quantity - item.quantity,
          updated_at = NOW()
      WHERE id = item.product_id
        AND stock_quantity >= item.quantity;

      GET DIAGNOSTICS touched_rows = ROW_COUNT;
      IF touched_rows = 0 THEN
        RAISE EXCEPTION 'Stock insuffisant pour le produit % sur la commande %', item.product_id, NEW.id;
      END IF;
    END LOOP;

    NEW.inventory_reserved_at := NOW();
    NEW.inventory_released_at := NULL;
  END IF;

  IF NEW.status IN ('cancelled', 'returned')
     AND COALESCE(OLD.status, '') NOT IN ('cancelled', 'returned')
     AND OLD.inventory_reserved_at IS NOT NULL
     AND OLD.inventory_released_at IS NULL THEN
    FOR item IN
      SELECT product_id, quantity
      FROM order_items
      WHERE order_id = NEW.id
    LOOP
      IF item.product_id IS NULL THEN
        CONTINUE;
      END IF;

      UPDATE products
      SET stock_quantity = stock_quantity + item.quantity,
          updated_at = NOW()
      WHERE id = item.product_id;
    END LOOP;

    NEW.inventory_released_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION is_current_customer(target_customer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = target_customer_id
$$;

CREATE OR REPLACE FUNCTION owns_order(target_order_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM orders
    WHERE id = target_order_id
      AND customer_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION owns_return(target_return_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM returns
    WHERE id = target_return_id
      AND customer_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION is_current_staff(target_staff_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid() = target_staff_id
$$;

DROP TRIGGER IF EXISTS trg_staff_profiles_updated_at ON staff_profiles;
CREATE TRIGGER trg_staff_profiles_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_customer_profiles_updated_at ON customer_profiles;
CREATE TRIGGER trg_customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_abandoned_carts_updated_at ON abandoned_carts;
CREATE TRIGGER trg_abandoned_carts_updated_at
  BEFORE UPDATE ON abandoned_carts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_shop_settings_updated_at ON shop_settings;
CREATE TRIGGER trg_shop_settings_updated_at
  BEFORE UPDATE ON shop_settings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_orders_reference ON orders;
CREATE TRIGGER trg_orders_reference
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_reference();

DROP TRIGGER IF EXISTS trg_returns_reference ON returns;
CREATE TRIGGER trg_returns_reference
  BEFORE INSERT ON returns
  FOR EACH ROW EXECUTE FUNCTION set_return_reference();

DROP TRIGGER IF EXISTS trg_customer_addresses_default ON customer_addresses;
CREATE TRIGGER trg_customer_addresses_default
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW EXECUTE FUNCTION set_single_default_address();

DROP TRIGGER IF EXISTS trg_customer_profiles_loyalty_level ON customer_profiles;
CREATE TRIGGER trg_customer_profiles_loyalty_level
  BEFORE INSERT OR UPDATE OF loyalty_points ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_customer_loyalty_level();

DROP TRIGGER IF EXISTS trg_loyalty_transactions_sync ON loyalty_transactions;
CREATE TRIGGER trg_loyalty_transactions_sync
  AFTER INSERT OR UPDATE ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION sync_customer_points_from_transaction();

DROP TRIGGER IF EXISTS trg_orders_inventory_sync ON orders;
CREATE TRIGGER trg_orders_inventory_sync
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION sync_order_inventory();

-- =============================================================
-- RLS
-- =============================================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_profiles_select_own ON staff_profiles;
CREATE POLICY staff_profiles_select_own
  ON staff_profiles FOR SELECT
  USING (is_current_staff(id));

DROP POLICY IF EXISTS staff_profiles_update_own ON staff_profiles;
CREATE POLICY staff_profiles_update_own
  ON staff_profiles FOR UPDATE
  USING (is_current_staff(id))
  WITH CHECK (is_current_staff(id));

DROP POLICY IF EXISTS customer_profiles_select_own ON customer_profiles;
CREATE POLICY customer_profiles_select_own
  ON customer_profiles FOR SELECT
  USING (is_current_customer(id));

DROP POLICY IF EXISTS customer_profiles_insert_own ON customer_profiles;
CREATE POLICY customer_profiles_insert_own
  ON customer_profiles FOR INSERT
  WITH CHECK (is_current_customer(id));

DROP POLICY IF EXISTS customer_profiles_update_own ON customer_profiles;
CREATE POLICY customer_profiles_update_own
  ON customer_profiles FOR UPDATE
  USING (is_current_customer(id))
  WITH CHECK (is_current_customer(id));

DROP POLICY IF EXISTS customer_addresses_select_own ON customer_addresses;
CREATE POLICY customer_addresses_select_own
  ON customer_addresses FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS customer_addresses_insert_own ON customer_addresses;
CREATE POLICY customer_addresses_insert_own
  ON customer_addresses FOR INSERT
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS customer_addresses_update_own ON customer_addresses;
CREATE POLICY customer_addresses_update_own
  ON customer_addresses FOR UPDATE
  USING (is_current_customer(customer_id))
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS customer_addresses_delete_own ON customer_addresses;
CREATE POLICY customer_addresses_delete_own
  ON customer_addresses FOR DELETE
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS products_select_public ON products;
CREATE POLICY products_select_public
  ON products FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS promotions_select_public ON promotions;
CREATE POLICY promotions_select_public
  ON promotions FOR SELECT
  USING (
    is_active = true
    AND starts_at <= NOW()
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS orders_select_own ON orders;
CREATE POLICY orders_select_own
  ON orders FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS orders_insert_own ON orders;
CREATE POLICY orders_insert_own
  ON orders FOR INSERT
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS orders_update_own ON orders;
CREATE POLICY orders_update_own
  ON orders FOR UPDATE
  USING (is_current_customer(customer_id) AND status = 'pending')
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS order_items_select_own ON order_items;
CREATE POLICY order_items_select_own
  ON order_items FOR SELECT
  USING (owns_order(order_id));

DROP POLICY IF EXISTS order_items_insert_own ON order_items;
CREATE POLICY order_items_insert_own
  ON order_items FOR INSERT
  WITH CHECK (owns_order(order_id));

DROP POLICY IF EXISTS order_items_update_own ON order_items;
CREATE POLICY order_items_update_own
  ON order_items FOR UPDATE
  USING (owns_order(order_id))
  WITH CHECK (owns_order(order_id));

DROP POLICY IF EXISTS order_items_delete_own ON order_items;
CREATE POLICY order_items_delete_own
  ON order_items FOR DELETE
  USING (owns_order(order_id));

DROP POLICY IF EXISTS returns_select_own ON returns;
CREATE POLICY returns_select_own
  ON returns FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS returns_insert_own ON returns;
CREATE POLICY returns_insert_own
  ON returns FOR INSERT
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS returns_update_own ON returns;
CREATE POLICY returns_update_own
  ON returns FOR UPDATE
  USING (is_current_customer(customer_id) AND status = 'pending')
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS return_items_select_own ON return_items;
CREATE POLICY return_items_select_own
  ON return_items FOR SELECT
  USING (owns_return(return_id));

DROP POLICY IF EXISTS return_items_insert_own ON return_items;
CREATE POLICY return_items_insert_own
  ON return_items FOR INSERT
  WITH CHECK (owns_return(return_id));

DROP POLICY IF EXISTS return_items_update_own ON return_items;
CREATE POLICY return_items_update_own
  ON return_items FOR UPDATE
  USING (owns_return(return_id))
  WITH CHECK (owns_return(return_id));

DROP POLICY IF EXISTS promo_usages_select_own ON promo_usages;
CREATE POLICY promo_usages_select_own
  ON promo_usages FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS loyalty_transactions_select_own ON loyalty_transactions;
CREATE POLICY loyalty_transactions_select_own
  ON loyalty_transactions FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS product_reviews_select_public ON product_reviews;
CREATE POLICY product_reviews_select_public
  ON product_reviews FOR SELECT
  USING (is_published = true OR is_current_customer(customer_id));

DROP POLICY IF EXISTS product_reviews_insert_own ON product_reviews;
CREATE POLICY product_reviews_insert_own
  ON product_reviews FOR INSERT
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS product_reviews_update_own ON product_reviews;
CREATE POLICY product_reviews_update_own
  ON product_reviews FOR UPDATE
  USING (is_current_customer(customer_id))
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS delivery_zones_select_public ON delivery_zones;
CREATE POLICY delivery_zones_select_public
  ON delivery_zones FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS stock_notifications_insert_public ON stock_notifications;
CREATE POLICY stock_notifications_insert_public
  ON stock_notifications FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS abandoned_carts_select_own ON abandoned_carts;
CREATE POLICY abandoned_carts_select_own
  ON abandoned_carts FOR SELECT
  USING (is_current_customer(customer_id));

DROP POLICY IF EXISTS abandoned_carts_insert_own ON abandoned_carts;
CREATE POLICY abandoned_carts_insert_own
  ON abandoned_carts FOR INSERT
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS abandoned_carts_update_own ON abandoned_carts;
CREATE POLICY abandoned_carts_update_own
  ON abandoned_carts FOR UPDATE
  USING (is_current_customer(customer_id))
  WITH CHECK (is_current_customer(customer_id));

DROP POLICY IF EXISTS shop_settings_select_public ON shop_settings;
CREATE POLICY shop_settings_select_public
  ON shop_settings FOR SELECT
  USING (true);
