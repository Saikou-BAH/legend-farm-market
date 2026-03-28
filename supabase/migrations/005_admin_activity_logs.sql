CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff_profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at
  ON admin_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_entity
  ON admin_activity_logs(entity_type, entity_id);

ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_activity_logs_select_own ON admin_activity_logs;
CREATE POLICY admin_activity_logs_select_own
  ON admin_activity_logs FOR SELECT
  USING (staff_id = auth.uid());
