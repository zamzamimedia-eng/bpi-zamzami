const mysql = require('mysql2/promise');
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
            // Test if we can insert only project_id and to_be_json
            await conn.query('INSERT INTO process_maps (project_id, to_be_json) VALUES (999, "{}") ON DUPLICATE KEY UPDATE to_be_json = "{}"');
            console.log('Partial Insert Success!');
        } catch (e) {
            console.error('Partial Insert Failed:', e.message);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}
test();
