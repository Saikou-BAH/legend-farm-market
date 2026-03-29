-- Migration 010 — Commandes invité (guest checkout)
-- Ajoute les champs guest_name et guest_phone à la table orders
-- pour permettre les commandes sans compte client.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS guest_name  TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

-- Index pour retrouver facilement les commandes invités
CREATE INDEX IF NOT EXISTS idx_orders_guest
  ON orders(guest_phone)
  WHERE customer_id IS NULL;

-- Commentaire de documentation
COMMENT ON COLUMN orders.guest_name  IS 'Nom du client pour une commande passée sans compte (guest checkout)';
COMMENT ON COLUMN orders.guest_phone IS 'Téléphone du client pour une commande passée sans compte (guest checkout)';
