-- Add category column (BPM / SBPM) to projects table
ALTER TABLE projects ADD COLUMN category VARCHAR(10) DEFAULT 'BPM' AFTER description;
