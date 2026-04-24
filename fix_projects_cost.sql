-- File: fix_projects_cost.sql
-- Ini buat nambahin kolom biaya kalo belum ada
-- Kalo di jalanin via phpMyAdmin, abaikan aja kalo ada error "Duplicate column"

-- 1. Tambah actual_cost
ALTER TABLE projects ADD COLUMN actual_cost DECIMAL(15,2) DEFAULT 0;

-- 2. Tambah potential_saving_cost
ALTER TABLE projects ADD COLUMN potential_saving_cost DECIMAL(15,2) DEFAULT 0;

-- 3. Tambah updated_at
ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. Sync status ENUM
ALTER TABLE projects MODIFY COLUMN status ENUM('draft', 'analyzing', 'executing', 'completed') DEFAULT 'draft';
