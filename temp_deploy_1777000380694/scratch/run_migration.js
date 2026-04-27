const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function migrate() {
    const config = {
        user: 'ponp9455_bpi',
        database: 'ponp9455_bpi',
        password: 'BNQK*v(~jW!h(@$V'
    };

    const defaultSocket = '/tmp/mysql.sock';
    if (fs.existsSync(defaultSocket)) {
        config.socketPath = defaultSocket;
        console.log(`Using socket: ${defaultSocket}`);
    } else {
        config.host = '127.0.0.1';
        console.log(`Using host: ${config.host}`);
    }

    const connection = await mysql.createConnection(config);

    console.log('Connected to database. Running migration...');

    const sqlFile = path.join(__dirname, '..', 'fix_actors_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon but ignore inside quotes
    const statements = sql.split(/;(?=(?:[^']*'[^']*')*[^']*$)/).filter(s => s.trim().length > 0);

    for (let statement of statements) {
        try {
            await connection.query(statement);
            console.log('✓ Success executing statement');
        } catch (err) {
            console.error('✗ Error executing statement:', err.message);
        }
    }

    console.log('\nMigration complete!');
    await connection.end();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
