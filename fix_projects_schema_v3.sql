-- Add pic and deadline to projects table
ALTER TABLE projects ADD COLUMN pic VARCHAR(255) AFTER status;
ALTER TABLE projects ADD COLUMN deadline DATE AFTER pic;

-- Clean up tasks table (optional, but good for cleanliness since cards are moving to projects)
-- DELETE FROM tasks WHERE source_node_id IS NOT NULL;
