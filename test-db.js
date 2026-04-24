const mysql = require('mysql2/promise');

async function testConn() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'bpi_db'
        });
        console.log('✅ DATABASE SUCCESS: Terhubung ke bpi_db!');
        await connection.end();
    } catch (err) {
        console.error('❌ DATABASE ERROR:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('TIPS: Pastikan MySQL di XAMPP sudah di-START!');
        } else if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('TIPS: Database bpi_db belum dibuat di phpMyAdmin!');
        }
    }
}

testConn();
