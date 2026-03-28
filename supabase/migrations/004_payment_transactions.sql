CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customer_profiles(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('orange_money', 'mtn_money', 'bank_transfer', 'cash_on_delivery', 'account_credit', 'loyalty_points')),
  transaction_type TEXT NOT NULL
    CHECK (transaction_type IN ('charge', 'refund')),
  status TEXT NOT NULL
    CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency_code TEXT NOT NULL DEFAULT 'GNF'
    CHECK (currency_code = 'GNF'),
  provider TEXT,
  provider_reference TEXT,
  note TEXT,
  created_by_staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_created
  ON payment_transactions(order_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_customer_created
  ON payment_transactions(customer_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_status_created
  ON payment_transactions(status, created_at DESC);

CREATE OR REPLACE FUNCTION recalculate_order_payment_state(target_order_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  target_total NUMERIC(15, 2);
  successful_charge_total NUMERIC(15, 2);
  successful_refund_total NUMERIC(15, 2);
  latest_successful_charge_at TIMESTAMPTZ;
  net_paid NUMERIC(15, 2);
  next_payment_status TEXT;
BEGIN
  SELECT total_amount
  INTO target_total
  FROM orders
  WHERE id = target_order_id;

  IF target_total IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(amount), 0),
    MAX(COALESCE(processed_at, created_at))
  INTO successful_charge_total, latest_successful_charge_at
  FROM payment_transactions
  WHERE order_id = target_order_id
    AND transaction_type = 'charge'
    AND status = 'succeeded';

  SELECT COALESCE(SUM(amount), 0)
  INTO successful_refund_total
  FROM payment_transactions
  WHERE order_id = target_order_id
    AND transaction_type = 'refund'
    AND status = 'succeeded';

  net_paid := GREATEST(successful_charge_total - successful_refund_total, 0);

  IF successful_refund_total > 0
     AND successful_charge_total > 0
     AND net_paid = 0 THEN
    next_payment_status := 'refunded';
  ELSIF net_paid = 0 THEN
    next_payment_status := 'pending';
  ELSIF net_paid < target_total THEN
    next_payment_status := 'partial';
  ELSE
    next_payment_status := 'paid';
  END IF;

  UPDATE orders
  SET payment_status = next_payment_status,
      paid_at = latest_successful_charge_at,
      updated_at = NOW()
  WHERE id = target_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION refresh_order_payment_state()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  affected_order_id UUID;
BEGIN
  affected_order_id := COALESCE(NEW.order_id, OLD.order_id);
  PERFORM recalculate_order_payment_state(affected_order_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_payment_transactions_refresh_order_state ON payment_transactions;
CREATE TRIGGER trg_payment_transactions_refresh_order_state
  AFTER INSERT OR UPDATE OR DELETE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION refresh_order_payment_state();

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payment_transactions_select_own ON payment_transactions;
CREATE POLICY payment_transactions_select_own
  ON payment_transactions FOR SELECT
  USING (owns_order(order_id));
