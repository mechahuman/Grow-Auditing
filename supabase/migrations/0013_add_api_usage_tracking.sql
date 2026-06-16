-- 0013_add_api_usage_tracking.sql
-- Add API usage tracking tables for monitoring API quotas and costs

-- Create api_keys table to store API metadata and limits
CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name text NOT NULL UNIQUE, -- 'youtube', 'groq', 'google_sheets', 'supabase'
  service_type text NOT NULL, -- 'enrichment', 'ai_analysis', 'data_export', 'database'
  display_name text, -- 'YouTube Data API', 'Groq AI API', etc.
  max_quota_daily int, -- Daily quota limit (e.g., 10000 for YouTube)
  max_quota_monthly int, -- Monthly quota limit
  quota_reset_type text, -- 'daily' or 'monthly'
  quota_reset_date date, -- Next reset date
  status text DEFAULT 'active', -- 'active', 'inactive', 'error'
  cost_per_unit decimal(10,6), -- Cost per API unit (e.g., 0.000015 per YouTube unit)
  cost_currency text DEFAULT 'USD',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create api_usage_logs table to track each API call
CREATE TABLE api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text, -- Which endpoint was called (e.g., 'channels.list')
  status text, -- 'success' or 'error'
  error_message text, -- nullable
  quota_units_used int DEFAULT 1, -- Units consumed (e.g., 1 for YouTube)
  response_time_ms int, -- Milliseconds to complete
  cost_cents int DEFAULT 0, -- Cost in cents for this call
  created_at timestamp DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_logs_api_key_date ON api_usage_logs(api_key_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_user_id ON api_usage_logs(user_id);

-- Pre-populate api_keys with all 4 APIs
INSERT INTO api_keys (api_name, service_type, display_name, max_quota_daily, max_quota_monthly, quota_reset_type, quota_reset_date, status, cost_per_unit) VALUES
  ('youtube', 'enrichment', 'YouTube Data API', 10000, 300000, 'daily', now()::date + INTERVAL '1 day', 'active', 0.000015),
  ('groq', 'ai_analysis', 'Groq AI API', 100000, 1000000, 'monthly', now()::date + INTERVAL '1 month', 'active', 0.0001),
  ('google_sheets', 'data_export', 'Google Sheets API', 500, 500000, 'daily', now()::date + INTERVAL '1 day', 'active', 0),
  ('supabase', 'database', 'Supabase PostgreSQL', NULL, NULL, 'monthly', now()::date + INTERVAL '1 month', 'active', 0);

-- Add comment on tables
COMMENT ON TABLE api_keys IS 'Metadata for external APIs used in the system, including quota limits and cost tracking';
COMMENT ON TABLE api_usage_logs IS 'Log of all API calls made by team members, used for quota monitoring and cost tracking';
