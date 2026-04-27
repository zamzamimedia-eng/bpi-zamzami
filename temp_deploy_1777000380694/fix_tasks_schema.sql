-- Fix tasks table schema - Add description column
ALTER TABLE tasks ADD COLUMN description TEXT AFTER title;
