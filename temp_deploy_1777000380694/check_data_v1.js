const mysql = require('/www/wwwroot/bpi-app/node_modules/mysql2/promise');
const fs = require('fs');

async function check() {
    const defaultSocket = '/tmp/mysql.sock';
    const config = {
        user: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V',
        database: 'ponp9455_bpi',
        socketPath: defaultSocket
    };

    let conn;
    try {
        conn = await mysql.createConnection(config);
        console.log('--- process_maps Data Check ---');
        const [rows] = await conn.query('SELECT project_id, CHAR_LENGTH(canvas_json) as len, LEFT(canvas_json, 50) as snippet FROM process_maps');
        console.table(rows);
        
        console.log('\n--- notifications Table Check ---');
        try {
            const [cols] = await conn.query('SHOW COLUMNS FROM notifications');
            console.table(cols);
        } catch (e) { console.error('Notifications check failed:', e.message); }

    } catch (err) {
        console.error('Check Error:', err);
    } finally {
        if (conn) await conn.end();
    }
}
check();
