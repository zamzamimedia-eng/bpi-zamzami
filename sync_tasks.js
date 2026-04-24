const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Try to load .env if it exists (for server-side execution)
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) process.env[key.trim()] = value.trim();
        });
    }
}

loadEnv();

const poolConfig = {
    user: process.env.DB_USER || 'ponp9455_bpi',
    password: process.env.DB_PASSWORD || 'BNQK*v(~jW!h(@$V',
    database: process.env.DB_NAME || 'ponp9455_bpi',
    host: process.env.DB_HOST || '127.0.0.1',
};

// Automagically detect aaPanel socket
const defaultSocket = '/tmp/mysql.sock';
if (fs.existsSync(defaultSocket)) {
    poolConfig.socketPath = defaultSocket;
    delete poolConfig.host;
    console.log(`> Sync Script: Using Socket ${defaultSocket}`);
} else {
    console.log(`> Sync Script: Using Host ${poolConfig.host}`);
}

async function syncAll() {
    console.log('--- Starting Global Process-to-Task Sync ---');
    console.log(`Connecting as: ${poolConfig.user} to ${poolConfig.database}`);
    
    let pool;
    try {
        pool = mysql.createPool(poolConfig);

        // Enforce schema
        console.log('Ensuring source_node_id column exists...');
        const [nodeIdCol] = await pool.query('SHOW COLUMNS FROM tasks LIKE "source_node_id"');
        if (nodeIdCol.length === 0) {
            console.log('Adding source_node_id column...');
            await pool.query('ALTER TABLE tasks ADD COLUMN source_node_id VARCHAR(100) AFTER project_id');
            await pool.query('CREATE INDEX idx_source_node ON tasks(source_node_id)');
        }

        // Get all process maps
        const [maps] = await pool.query('SELECT project_id, canvas_json, to_be_json FROM process_maps');
        console.log(`Found ${maps.length} process maps to sync.`);

        for (const map of maps) {
            const { project_id, canvas_json, to_be_json } = map;
            try {
                const asIs = typeof canvas_json === 'string' ? JSON.parse(canvas_json) : canvas_json;
                const toBe = to_be_json ? (typeof to_be_json === 'string' ? JSON.parse(to_be_json) : to_be_json) : null;
                
                // We sync nodes from To-Be if it exists, otherwise As-Is
                const sourceData = (toBe && toBe.nodes && toBe.nodes.length > 0) ? toBe : asIs;
                
                if (sourceData && sourceData.nodes) {
                    const processNodes = sourceData.nodes.filter(n => n.type === 'process');
                    let count = 0;
                    for (const node of processNodes) {
                        const title = node.data?.label || 'Untitled Step';
                        const pic = node.data?.role || 'Unassigned';
                        const nodeId = node.id;
                        
                        await pool.query(
                            `INSERT INTO tasks (project_id, source_node_id, title, status, pic, deadline) 
                             VALUES (?, ?, ?, 'todo', ?, CURDATE())
                             ON DUPLICATE KEY UPDATE title = VALUES(title), pic = VALUES(pic)`,
                            [project_id, nodeId, title, pic]
                        );
                        count++;
                    }
                    if (count > 0) console.log(`[Project ${project_id}] Synced ${count} steps.`);
                }
            } catch (e) {
                console.error(`[Project ${project_id}] Sync error:`, e.message);
            }
        }
        console.log('--- Global Sync Finished ---');
    } catch (err) {
        console.error('Final Error:', err);
    } finally {
        if (pool) await pool.end();
    }
}

syncAll();
