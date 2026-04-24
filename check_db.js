import pool from './src/lib/db.js';

async function checkSchema() {
    try {
        const [rows] = await pool.query('SHOW CREATE TABLE process_maps');
        console.log(rows[0]['Create Table']);
        
        const [projects] = await pool.query('SHOW CREATE TABLE projects');
        console.log(projects[0]['Create Table']);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
