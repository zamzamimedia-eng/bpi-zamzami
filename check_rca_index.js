const mysql = require('mysql2/promise');

async function check() {
    const pool = mysql.createPool({
        user: 'root',
        password: '',
        database: 'ponp9455_bpi',
        host: '127.0.0.1',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        charset: 'utf8mb4'
    });

    try {
        const [indexes] = await pool.query("SHOW INDEX FROM root_cause_analysis");
        console.log("Indexes in root_cause_analysis:", indexes);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
check();
