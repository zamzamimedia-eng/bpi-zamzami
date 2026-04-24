import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        const schema = {};
        
        for (const table of tables) {
            const tableName = Object.values(table)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            schema[tableName] = columns;
        }
        
        return NextResponse.json({ tables: Object.keys(schema), schema });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
