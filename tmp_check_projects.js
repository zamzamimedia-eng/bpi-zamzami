import pool from './src/lib/db.js';

async function checkSchema() {
    try {
        const [rows] = await pool.query('DESCRIBE projects');
        console.log('--- projects schema ---');
        rows.forEach(row => {
            console.log(`${row.Field}: ${row.Type}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Failed to check schema:', err);
        process.exit(1);
    }
}

checkSchema();
