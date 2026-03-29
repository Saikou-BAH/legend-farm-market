-- Migration 011 — Fonction FIFO consume_stock_fifo()
--
-- Consomme du stock en mode FIFO (First In First Out) :
-- sélectionne les stock_entries les plus anciennes en premier,
-- insère les stock_movements correspondants, et retourne la quantité
-- effectivement consommée.
--
-- Le trigger trg_decrement_stock_entry (migration 008) s'occupe
-- automatiquement de décrémenter remaining_qty et de passer la bande
-- en status = 'depleted' quand tout le stock est épuisé.

CREATE OR REPLACE FUNCTION consume_stock_fifo(
  p_product_id    UUID,
  p_quantity      INTEGER,
  p_order_item_id UUID DEFAULT NULL
)
RETURNS INTEGER   -- quantité totale effectivement consommée
LANGUAGE plpgsql
SECURITY DEFINER  -- s'exécute avec les droits du propriétaire (service role)
AS $$
DECLARE
  v_remaining   INTEGER := p_quantity;
  v_consumed    INTEGER := 0;
  v_entry       RECORD;
  v_take        INTEGER;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN 0;
  END IF;

  -- Parcourir les entrées dans l'ordre d'arrivée (FIFO)
  FOR v_entry IN
    SELECT id, remaining_qty
    FROM stock_entries
    WHERE product_id = p_product_id
      AND remaining_qty > 0
    ORDER BY entered_at ASC
    FOR UPDATE SKIP LOCKED   -- évite les conflits d'accès concurrent
  LOOP
    EXIT WHEN v_remaining <= 0;

    -- Prendre le minimum entre ce qu'on veut et ce qui reste dans cette entrée
    v_take := LEAST(v_remaining, v_entry.remaining_qty);

    -- Insérer le mouvement (le trigger décrémente remaining_qty automatiquement)
    INSERT INTO stock_movements (
      product_id,
      stock_entry_id,
      order_item_id,
      quantity_consumed
    ) VALUES (
      p_product_id,
      v_entry.id,
      p_order_item_id,
      v_take
    );

    v_remaining := v_remaining - v_take;
    v_consumed  := v_consumed  + v_take;
  END LOOP;

  RETURN v_consumed;
END;
$$;

-- Accorder l'exécution au rôle service_role
GRANT EXECUTE ON FUNCTION consume_stock_fifo(UUID, INTEGER, UUID) TO service_role;

COMMENT ON FUNCTION consume_stock_fifo IS
  'Consomme p_quantity unités du produit p_product_id en FIFO (oldest stock_entry first). '
  'Insère des stock_movements et retourne la quantité réellement consommée. '
  'Passe silencieusement si le stock FIFO est insuffisant (pas de rollback).';
