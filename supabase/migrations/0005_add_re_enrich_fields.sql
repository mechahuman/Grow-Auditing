-- Add re-enrich tracking fields to leads table
ALTER TABLE leads
ADD COLUMN re_enrich_count integer NOT NULL DEFAULT 0,
ADD COLUMN re_enriched_at timestamptz NULL;
