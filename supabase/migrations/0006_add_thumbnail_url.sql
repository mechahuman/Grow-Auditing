-- Add channel thumbnail URL to leads table
ALTER TABLE leads
ADD COLUMN channel_thumbnail_url text NULL;
