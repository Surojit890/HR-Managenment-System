-- Enable Row Level Security on the audit logs table.
-- Audit logs should only be written/read by the backend service role.
-- Direct access from anon/authenticated Supabase clients is denied.
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on the table to avoid duplicates when re-running.
DROP POLICY IF EXISTS "audit_logs_service_insert" ON "public"."audit_logs";
DROP POLICY IF EXISTS "audit_logs_service_select" ON "public"."audit_logs";
DROP POLICY IF EXISTS "audit_logs_service_update" ON "public"."audit_logs";
DROP POLICY IF EXISTS "audit_logs_service_delete" ON "public"."audit_logs";

-- Allow the service_role (backend) full access.
CREATE POLICY "audit_logs_service_insert"
  ON "public"."audit_logs"
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "audit_logs_service_select"
  ON "public"."audit_logs"
  FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "audit_logs_service_update"
  ON "public"."audit_logs"
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "audit_logs_service_delete"
  ON "public"."audit_logs"
  FOR DELETE
  TO service_role
  USING (true);
