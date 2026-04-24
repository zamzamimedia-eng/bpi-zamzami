-- Fix charset for emoji support
ALTER TABLE process_maps CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tasks CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE projects CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Also ensure the columns specifically are utf8mb4
ALTER TABLE process_maps MODIFY canvas_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE process_maps MODIFY to_be_json LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tasks MODIFY title VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE tasks MODIFY description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
