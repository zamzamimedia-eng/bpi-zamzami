-- Clean up duplicates before adding unique constraint
DELETE t1 FROM tasks t1
INNER JOIN tasks t2 
WHERE t1.id < t2.id 
  AND t1.project_id = t2.project_id 
  AND t1.source_node_id = t2.source_node_id 
  AND t1.source_node_id IS NOT NULL;

-- Add unique constraint to prevent future duplication
ALTER TABLE tasks ADD UNIQUE KEY project_node_idx (project_id, source_node_id);

-- Update existing tasks with PIC from process maps if possible
-- This is hard to do in pure SQL across JSON, so we'll rely on the next Sync call.
