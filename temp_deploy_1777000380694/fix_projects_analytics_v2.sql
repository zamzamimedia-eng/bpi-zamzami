-- Add analytics columns to projects table if they don't exist
ALTER TABLE projects ADD COLUMN total_steps INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN bottlenecks INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN potential_saving_time INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN potential_saving_cost DECIMAL(15,2) DEFAULT 0.00;
