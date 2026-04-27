-- Create actors table for PIC database
CREATE TABLE IF NOT EXISTS actors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Add actor_id to projects and tasks for future reference (optional linkage)
ALTER TABLE projects ADD COLUMN actor_id INT NULL AFTER tenant_id;
ALTER TABLE projects ADD FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE SET NULL;

ALTER TABLE tasks ADD COLUMN actor_id INT NULL AFTER project_id;
ALTER TABLE tasks ADD FOREIGN KEY (actor_id) REFERENCES actors(id) ON DELETE SET NULL;
