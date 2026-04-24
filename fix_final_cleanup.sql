-- Fix notifications table
ALTER TABLE notifications ADD COLUMN description TEXT AFTER title;

-- Robust charset conversion for process_maps
ALTER TABLE process_maps CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE process_maps MODIFY COLUMN canvas_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE process_maps MODIFY COLUMN to_be_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ensure tasks unique index
ALTER TABLE tasks DROP INDEX project_node_idx;
ALTER TABLE tasks ADD UNIQUE KEY project_node_idx (project_id, source_node_id);
