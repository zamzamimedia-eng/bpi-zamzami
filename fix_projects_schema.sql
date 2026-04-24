-- Fix projects table schema
ALTER TABLE projects ADD COLUMN description TEXT AFTER name;

-- Update status enum to match application values
ALTER TABLE projects MODIFY COLUMN status VARCHAR(50) DEFAULT 'draft';
