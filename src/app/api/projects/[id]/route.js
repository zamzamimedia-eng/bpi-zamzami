import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';

export async function GET(request, { params }) {
    const { id } = await params;
    try {
        const [rows] = await pool.query(`
            SELECT p.*, a.name as actor_name 
            FROM projects p 
            LEFT JOIN actors a ON p.actor_id = a.id 
            WHERE p.id = ?
        `, [id]);
        if (rows.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        
        const context = await getAuthorizedContext(request, rows[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        return NextResponse.json(rows[0]);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        const body = await request.json();
        
        // Cek project owner
        const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
        if (projects.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        
        const project = projects[0];
        const context = await getAuthorizedContext(request, project.tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        // Ownership checks
        if (project.created_by && context.user.id !== project.created_by && context.user.role !== 'admin') {
            return NextResponse.json({ message: 'Hanya pembuat proyek yang bisa mengubah data.' }, { status: 403 });
        }

        const name = body.name !== undefined ? body.name : project.name;
        const description = body.description !== undefined ? body.description : project.description;
        const status = body.status !== undefined ? body.status : project.status;
        const actual_cost = body.actual_cost !== undefined ? body.actual_cost : project.actual_cost;
        const potential_saving_cost = body.potential_saving_cost !== undefined ? body.potential_saving_cost : project.potential_saving_cost;
        const pic = body.pic !== undefined ? body.pic : project.pic;
        const deadline = body.deadline !== undefined ? body.deadline : project.deadline;
        const division_id = body.division_id !== undefined ? body.division_id : project.division_id;
        const frequency = body.frequency !== undefined ? body.frequency : project.frequency;
        const actor_id = body.actor_id !== undefined ? body.actor_id : project.actor_id;

        await pool.query(
            'UPDATE projects SET name = ?, description = ?, status = ?, actual_cost = ?, potential_saving_cost = ?, pic = ?, deadline = ?, division_id = ?, frequency = ?, actor_id = ? WHERE id = ?',
            [name, description, status, actual_cost, potential_saving_cost, pic, deadline, division_id || null, frequency, actor_id || null, id]
        );
        return NextResponse.json({ message: 'Project updated' });
    } catch (error) {
        console.error('Update Project Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        // Cek project owner
        const [projects] = await pool.query('SELECT tenant_id FROM projects WHERE id = ?', [id]);
        if (projects.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        
        const context = await getAuthorizedContext(request, projects[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        // Ownership checks
        if (projects[0].created_by && context.user.id !== projects[0].created_by && context.user.role !== 'admin') {
            return NextResponse.json({ message: 'Hanya pembuat proyek yang bisa menghapus data.' }, { status: 403 });
        }

        await pool.query('DELETE FROM projects WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Project deleted' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
