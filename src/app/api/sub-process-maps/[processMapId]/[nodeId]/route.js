import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';

export async function GET(request, { params }) {
    const { processMapId, nodeId } = await params;
    
    try {
        // Find the project ID first
        const [maps] = await pool.query('SELECT project_id FROM process_maps WHERE id = ?', [processMapId]);
        if (maps.length === 0) return NextResponse.json({ message: 'Process map not found' }, { status: 404 });
        
        const projectId = maps[0].project_id;
        
        // Find project to get tenant and ownership
        const [projects] = await pool.query('SELECT tenant_id, created_by FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        
        const context = await getAuthorizedContext(request, projects[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        const [rows] = await pool.query('SELECT id, canvas_json FROM sub_process_maps WHERE process_map_id = ? AND node_id = ?', [processMapId, nodeId]);
        if (rows.length === 0) {
            return NextResponse.json({ id: null, canvas_json: null, can_edit: (projects[0].created_by === null || context.user.id === projects[0].created_by || context.user.role === 'admin') });
        }
        
        let canvasJsonStr = rows[0].canvas_json;
        if (typeof canvasJsonStr === 'object' && canvasJsonStr !== null) {
            canvasJsonStr = JSON.stringify(canvasJsonStr);
        }
        
        return NextResponse.json({ 
            id: rows[0].id, 
            canvas_json: canvasJsonStr,
            can_edit: (projects[0].created_by === null || context.user.id === projects[0].created_by || context.user.role === 'admin')
        });
    } catch (error) {
        console.error('[API Load Sub-Canvas] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { processMapId, nodeId } = await params;
    try {
        const [maps] = await pool.query('SELECT project_id FROM process_maps WHERE id = ?', [processMapId]);
        if (maps.length === 0) return NextResponse.json({ message: 'Process map not found' }, { status: 404 });
        
        const projectId = maps[0].project_id;
        
        // Check ownership
        const [projects] = await pool.query('SELECT tenant_id, created_by FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });

        const context = await getAuthorizedContext(request, projects[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        // Ownership checks
        if (projects[0].created_by && context.user.id !== projects[0].created_by && context.user.role !== 'admin') {
            return NextResponse.json({ message: 'Hanya pembuat proyek yang bisa menyimpan perubahan kanvas.' }, { status: 403 });
        }

        const body = await request.json();
        const { canvas_json } = body;
        
        if (!canvas_json) {
            return NextResponse.json({ message: 'canvas_json is required' }, { status: 400 });
        }

        const canvasString = typeof canvas_json === 'string' ? canvas_json : JSON.stringify(canvas_json);

        // UPSERT logic
        await pool.query(
            'INSERT INTO sub_process_maps (process_map_id, node_id, canvas_json) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE canvas_json = ?',
            [processMapId, nodeId, canvasString, canvasString]
        );
        
        const [subMaps] = await pool.query('SELECT id FROM sub_process_maps WHERE process_map_id = ? AND node_id = ?', [processMapId, nodeId]);

        return NextResponse.json({ 
            message: 'Sub-Canvas saved successfully', 
            id: subMaps[0]?.id
        });
    } catch (error) {
        console.error('[API Save Sub-Canvas] General Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error', 
            error: error.message 
        }, { status: 500 });
    }
}
