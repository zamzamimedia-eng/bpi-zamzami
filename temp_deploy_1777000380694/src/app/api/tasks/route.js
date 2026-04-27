import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { notifyAdmins } from '@/lib/notifications';
import { cookies } from 'next/headers';
import { ensureTasksSchema, sanitizeTaskData, updateProjectStatus } from '@/lib/taskUtils';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const cookieStore = await cookies();
    const selectedTenantId = cookieStore.get('selected_tenant_id')?.value;
    const tenantId = searchParams.get('tenantId') || selectedTenantId;
    
    if (!tenantId) {
        return NextResponse.json({ message: 'Tenant ID is required' }, { status: 400 });
    }
    
    // Auto-repair schema if needed
    await ensureTasksSchema();

    try {
        let query = 'SELECT t.* FROM tasks t JOIN projects p ON t.project_id = p.id';
        let params = [];
        let conditions = ['p.tenant_id = ?'];
        params.push(tenantId);
        
        if (projectId) {
            conditions.push('t.project_id = ?');
            params.push(projectId);
        }
        
        query += ' WHERE ' + conditions.join(' AND ');
        
        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await ensureTasksSchema();
        const body = await request.json();
        const { project_id, title, description, pic, deadline, status = 'todo' } = sanitizeTaskData(body);
        
        const [result] = await pool.query(
            'INSERT INTO tasks (project_id, title, description, pic, deadline, status) VALUES (?, ?, ?, ?, ?, ?)',
            [project_id, title, description, pic, deadline, status]
        );

        // Fetch project name for better notification
        const [projects] = await pool.query('SELECT name FROM projects WHERE id = ?', [project_id]);
        const projectName = projects.length > 0 ? projects[0].name : 'Unknown';

        // Trigger notification
        await notifyAdmins({
            title: 'Tugas Baru Ditambahkan',
            description: `Tugas "${title}" ditambahkan ke dalam proyek "${projectName}". PIC: ${pic}`,
            type: 'info'
        });

        // Trigger automatic project status update
        await updateProjectStatus(project_id);

        return NextResponse.json({ id: result.insertId, title, status });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
