-- Fix process_maps table - add unique constraint to project_id for UPSERT logic
-- Fix process_maps table - delete duplicates before adding unique constraint
DELETE t1 FROM process_maps t1
INNER JOIN process_maps t2 
WHERE t1.id < t2.id AND t1.project_id = t2.project_id;

-- Add unique constraint to project_id for UPSERT logic
ALTER TABLE process_maps ADD UNIQUE KEY (project_id);
