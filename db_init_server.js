const mysql = require('mysql2/promise');

async function init() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'ponp9455_bpi',
        database: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V'
    });

    console.log('Connected to database. Initializing tables...');

    const tables = [
        `CREATE TABLE IF NOT EXISTS tenants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            plan VARCHAR(50) DEFAULT 'Basic',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255),
            role ENUM('admin', 'user') DEFAULT 'user',
            profile_photo VARCHAR(255) DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('draft', 'analyzing', 'executing', 'completed') DEFAULT 'draft',
            progress INT DEFAULT 0,
            analysis_status ENUM('not_started', 'in_progress', 'completed') DEFAULT 'not_started',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            actual_cost DECIMAL(15,2) DEFAULT 0,
            potential_saving_cost DECIMAL(15,2) DEFAULT 0,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS process_maps (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            canvas_json JSON,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            project_id INT,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('todo', 'doing', 'done') DEFAULT 'todo',
            pic VARCHAR(255),
            deadline DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS root_cause_analysis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            process_map_id INT NOT NULL,
            node_id VARCHAR(100) NOT NULL,
            problem_statement TEXT,
            why_1 TEXT,
            why_2 TEXT,
            why_3 TEXT,
            why_4 TEXT,
            why_5 TEXT,
            analyzed_by VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY (process_map_id, node_id),
            FOREIGN KEY (process_map_id) REFERENCES process_maps(id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS divisions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            UNIQUE KEY unique_division_per_tenant (tenant_id, name)
        )`,
        `CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
    ];

    for (const sql of tables) {
        await connection.query(sql);
        console.log('✓ Success executing statement');
    }

    // Seed default admin if no users exist
    const [userRows] = await connection.query('SELECT id FROM users LIMIT 1');
    if (userRows.length === 0) {
        console.log('Seeding default admin...');
        const [tenantResult] = await connection.query("INSERT INTO tenants (name, plan) VALUES ('Default Company', 'Enterprise')");
        const tenantId = tenantResult.insertId;
        // Password: admin123 (manually hashed or plain for now as per previous logic which has fallback)
        await connection.query("INSERT INTO users (tenant_id, username, password, full_name, role) VALUES (?, 'admin', 'admin123', 'Administrator', 'admin')", [tenantId]);
        console.log('✓ Default admin created (admin / admin123)');
    }

    console.log('\nDatabase initialization complete!');
    await connection.end();
}

init().catch(err => {
    console.error('Initialization failed:', err);
    process.exit(1);
});
