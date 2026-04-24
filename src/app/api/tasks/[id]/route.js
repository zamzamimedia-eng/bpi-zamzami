import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureTasksSchema, sanitizeTaskData, updateProjectStatus } from '@/lib/taskUtils';

export async function PUT(request, { params }) {
    const { id } = await params;
    try {
        await ensureTasksSchema();
        const body = await request.json();
        const { project_id, title, description, pic, deadline, status } = sanitizeTaskData(body);
        
        console.log(`> API Tasks [id] PUT: Updating task ${id} to status ${status}`);

        const [result] = await pool.query(
            'UPDATE tasks SET project_id = ?, title = ?, description = ?, pic = ?, deadline = ?, status = ? WHERE id = ?',
            [project_id, title, description, pic, deadline, status, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Task not found' }, { status: 404 });
        }

        // Trigger automatic project status update
        await updateProjectStatus(project_id);

        return NextResponse.json({ message: 'Task updated' });
    } catch (error) {
        console.error('> API Tasks [id] PUT Error:', error);
        return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Task deleted' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
