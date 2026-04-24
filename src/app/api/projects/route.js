import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { notifyAdmins } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { getAuthorizedContext } from '@/lib/auth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const context = await getAuthorizedContext(request, searchParams.get('tenantId'));
    
    if (!context) {
        return NextResponse.json({ message: 'Akses Ditolak (Unauthorized)' }, { status: 403 });
    }
    
    
    const { tenantId } = context;
    
    try {
        // Auto-patch schema if missing
        try {
            await pool.query('ALTER TABLE projects ADD COLUMN created_by INT NULL');
        } catch (e) { /* Ignore if exists */ }

        let query = `
            SELECT p.*, d.name as division_name, pm.id as process_map_id, a.name as actor_name, u.full_name as creator_name
            FROM projects p 
            LEFT JOIN divisions d ON p.division_id = d.id 
            LEFT JOIN process_maps pm ON p.id = pm.project_id 
            LEFT JOIN actors a ON p.actor_id = a.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.tenant_id = ?
        `;
        let params = [tenantId];
        
        query += ' ORDER BY p.created_at DESC';
        
        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, description, tenant_id, division_id = null, actual_cost = 0, potential_saving_cost = 0, status = 'draft', pic = 'Unassigned', deadline = null, actor_id = null } = body;
        const context = await getAuthorizedContext(request, tenant_id);

        if (!context) {
             return NextResponse.json({ message: 'Akses Ditolak (Unauthorized)' }, { status: 403 });
        }

        const { tenantId, user } = context;

        // Auto-patch missing columns if any (fail gracefully if they already exist)
        try {
            await pool.query('ALTER TABLE projects ADD COLUMN division_id INT NULL');
        } catch (e) { /* Ignore if exists */ }
        try {
            await pool.query('ALTER TABLE projects ADD COLUMN actor_id INT NULL');
        } catch (e) { /* Ignore if exists */ }
        try {
            await pool.query('ALTER TABLE projects ADD COLUMN created_by INT NULL');
        } catch (e) { /* Ignore if exists */ }

        const [result] = await pool.query(
            'INSERT INTO projects (name, description, tenant_id, division_id, status, actual_cost, potential_saving_cost, pic, actor_id, deadline, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, description, tenantId, division_id || null, status, actual_cost, potential_saving_cost, pic, actor_id || null, deadline || null, user.id]
        );

        // Fetch tenant name for better notification
        const [tenants] = await pool.query('SELECT name FROM tenants WHERE id = ?', [tenantId]);
        const tenantName = tenants.length > 0 ? tenants[0].name : 'Unknown';

        // Trigger notification
        await notifyAdmins({
            title: 'Proyek Baru Dibuat',
            description: `Proyek "${name}" telah ditambahkan untuk perusahaan ${tenantName}.`,
            type: 'success'
        });

        return NextResponse.json({ id: result.insertId, name, description, status: 'draft' });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message, stack: error.stack }, { status: 500 });
    }
}
