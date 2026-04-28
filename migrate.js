import 'dotenv/config';
import pool from './src/lib/db.js';
import fs from 'fs';
import path from 'path';

async function migrate() {
    try {
        console.log('--- Starting Database Migrations ---');
        
        // Find all fix_*.sql files
        const files = [
            'fix_projects_schema.sql',
            'fix_tasks_schema.sql',
            'fix_tasks_unique_sync_v2.sql',
            'fix_final_cleanup.sql',
            'fix_projects_schema_v3.sql',
            'fix_projects_performance_columns.sql',
            'fix_actors_table.sql',
            'fix_projects_category.sql',
            'fix_sub_process_maps.sql',
            'fix_utf8mb4_charset.sql'
        ];
        
        for (const file of files) {
            console.log(`Running migration: ${file}...`);
            const sql = fs.readFileSync(file, 'utf8');
            
            // split by semicolon but handle multiline
            const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
            
            for (const statement of statements) {
                try {
                    await pool.query(statement);
                    console.log('  [OK] Statement executed');
                } catch (err) {
                    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_DUP_KEYNAME') {
                        console.log('  [SKIP] Column/Index already exists');
                    } else {
                        console.error('  [ERROR] Statement failed:', err.message);
                    }
                }
            }
        }
        
        console.log('--- Database Migrations Finished ---');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
