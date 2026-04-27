-- Add to_be_json column to process_maps table
ALTER TABLE process_maps ADD COLUMN to_be_json LONGTEXT DEFAULT NULL;
