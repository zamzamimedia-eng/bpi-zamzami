-- Migration: Add cost fields to projects table
-- Run this on the MySQL server manually

ALTER TABLE projects ADD COLUMN actual_cost DECIMAL(15,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN potential_saving_cost DECIMAL(15,2) DEFAULT 0;
