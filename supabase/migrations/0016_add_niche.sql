-- 0016_add_niche.sql
-- Add niche classification fields to leads table

ALTER TABLE leads
  ADD COLUMN niche text NULL,
  ADD COLUMN niche_custom text NULL;

COMMENT ON COLUMN leads.niche IS 'AI-classified niche from predefined list';
COMMENT ON COLUMN leads.niche_custom IS 'AI-suggested custom niche label when niche = Others';
