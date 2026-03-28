INSERT INTO shop_settings (key, value, description)
VALUES
  ('loyalty_point_value', '1', 'Valeur en GNF d un point fidelite utilise au checkout')
ON CONFLICT (key) DO NOTHING;
