const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });
    
    try {
        console.log('Checking projects table columns...');
        const [columns] = await pool.query('SHOW COLUMNS FROM projects');
        console.log('Columns found:', columns.map(c => c.Field).join(', '));
        
        if (!columns.some(c => c.Field === 'created_by')) {
            console.log('Column created_by missing! Adding it...');
            await pool.query('ALTER TABLE projects ADD COLUMN created_by INT NULL');
            console.log('Column created_by added successfully.');
        } else {
            console.log('Column created_by already exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

check();
