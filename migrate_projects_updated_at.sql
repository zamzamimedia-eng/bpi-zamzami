-- Migration: Add updated_at to projects and sync status ENUM
-- Run this on the MySQL server manually

ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
ALTER TABLE projects MODIFY COLUMN status ENUM('draft', 'analyzing', 'executing', 'completed') DEFAULT 'draft';
