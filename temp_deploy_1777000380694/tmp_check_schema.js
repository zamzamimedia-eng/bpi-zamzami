const mysql = require('mysql2/promise');

async function test() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'ponp9455_bpi',
        database: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V'
    });

    console.log('Checking tasks table structure...');
    const [rows] = await connection.query('DESCRIBE tasks');
    console.log(JSON.stringify(rows, null, 2));
    
    await connection.end();
}

test().catch(console.error);
