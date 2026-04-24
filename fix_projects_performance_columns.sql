-- Add performance metrics and frequency to projects table
ALTER TABLE projects 
ADD COLUMN frequency INT DEFAULT 1,
ADD COLUMN as_is_steps INT DEFAULT 0,
ADD COLUMN to_be_steps INT DEFAULT 0,
ADD COLUMN as_is_time INT DEFAULT 0,
ADD COLUMN to_be_time INT DEFAULT 0,
ADD COLUMN as_is_cost DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN to_be_cost DECIMAL(15,2) DEFAULT 0.00;
