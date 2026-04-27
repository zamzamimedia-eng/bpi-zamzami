const mysql = require('/www/wwwroot/bpi-app/node_modules/mysql2/promise');
const fs = require('fs');

async function test() {
    const defaultSocket = '/tmp/mysql.sock';
    const config = {
        user: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V',
        database: 'ponp9455_bpi',
    };
    if (fs.existsSync(defaultSocket)) config.socketPath = defaultSocket;
    else config.host = '127.0.0.1';

    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log('--- DB Schema Check ---');
        const [cols] = await conn.query('SHOW COLUMNS FROM process_maps');
        console.table(cols);
        
        console.log('\n--- Testing Partial Insert ---');
        try {
            // Use a temporary project ID that won't conflict
            await conn.query('INSERT INTO process_maps (project_id, canvas_json, to_be_json) VALUES (9999, "{}", "{}") ON DUPLICATE KEY UPDATE to_be_json = "{}"');
            console.log('UPSERT Test Success!');
            await conn.query('DELETE FROM process_maps WHERE project_id = 9999');
        } catch (e) {
            console.error('UPSERT Test Failed:', e.message);
        }
    } catch (err) {
        console.error('Connection Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}
test();
