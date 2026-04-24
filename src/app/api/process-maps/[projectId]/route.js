import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';

export async function GET(request, { params }) {
    const { projectId } = await params;
    console.log(`[API Load Canvas] Project ID: ${projectId}`);
    try {
        // First find the project to get tenant_id
        const [projects] = await pool.query('SELECT tenant_id, created_by FROM projects WHERE id = ?', [projectId]);
        if (projects.length === 0) return NextResponse.json({ message: 'Project not found' }, { status: 404 });
        
        const context = await getAuthorizedContext(request, projects[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        const [rows] = await pool.query('SELECT id, canvas_json, to_be_json FROM process_maps WHERE project_id = ?', [projectId]);
        if (rows.length === 0) {
            console.log('[API Load Canvas] No data found for this project');
            return NextResponse.json({ id: null, canvas_json: null });
        }
        
        // Ensure canvas_json is always returned as a string for consistent parsing on the client
        const row = rows[0];
        let canvasJsonStr = row.canvas_json;
        if (typeof canvasJsonStr === 'object' && canvasJsonStr !== null) {
            canvasJsonStr = JSON.stringify(canvasJsonStr);
        }
        
        console.log(`[API Load Canvas] Found data, canvas_json type: ${typeof row.canvas_json}, str length: ${String(canvasJsonStr).length}`);
        
        // Fetch task statuses for this project to enable visual sync
        const [tasks] = await pool.query('SELECT source_node_id, status FROM tasks WHERE project_id = ? AND source_node_id IS NOT NULL', [projectId]);
        const taskStatusMap = {};
        tasks.forEach(t => {
            taskStatusMap[t.source_node_id] = t.status;
        });

        return NextResponse.json({ 
            id: row.id, 
            canvas_json: canvasJsonStr,
            to_be_json: row.to_be_json,
            task_status_map: taskStatusMap,
            can_edit: (projects[0].created_by === null || context.user.id === projects[0].created_by || context.user.role === 'admin')
        });
    } catch (error) {
        console.error('[API Load Canvas] Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    const { projectId } = await params;
    try {
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
        const { canvas_json, to_be_json } = body;
        
        console.log(`[API Save Canvas] Project ID: ${projectId}`);
        
        if (!canvas_json && !to_be_json) {
            console.error('[API Save Canvas] Error: Both canvas_json and to_be_json are missing');
            return NextResponse.json({ message: 'canvas_json or to_be_json is required' }, { status: 400 });
        }

        const canvasString = canvas_json ? (typeof canvas_json === 'string' ? canvas_json : JSON.stringify(canvas_json)) : null;

        // UPSERT logic: update if exists, insert if not
        try {
            if (canvas_json && to_be_json) {
                // Update both
                await pool.query(
                    'INSERT INTO process_maps (project_id, canvas_json, to_be_json) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE canvas_json = ?, to_be_json = ?',
                    [projectId, canvasString, to_be_json, canvasString, to_be_json]
                );
            } else if (to_be_json) {
                // IMPORTANT: Provide a default canvas_json for the INSERT part if it doesn't exist yet
                await pool.query(
                    'INSERT INTO process_maps (project_id, canvas_json, to_be_json) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE to_be_json = ?',
                    [projectId, '{"nodes":[],"edges":[]}', to_be_json, to_be_json]
                );
            } else {
                // Update only canvas_json (backward compatibility)
                await pool.query(
                    'INSERT INTO process_maps (project_id, canvas_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE canvas_json = ?',
                    [projectId, canvasString, canvasString]
                );
            }
            
            // Fetch the ID (newly created or existing) to return to frontend
            const [mapRows] = await pool.query('SELECT id FROM process_maps WHERE project_id = ?', [projectId]);
            var mapId = mapRows[0]?.id;
        } catch (dbError) {
            console.error('[API Save Canvas] Database Insert/Update Error (UPSERT):', dbError);
            return NextResponse.json({ 
                message: 'Gagal menyimpan ke Database (DB Error)', 
                error: dbError.message,
                sqlState: dbError.sqlState 
            }, { status: 500 });
        }

        // Calculate summary stats from JSON
        let asIsSteps = 0;
        let toBeSteps = 0;
        let asIsTime = 0;
        let toBeTime = 0;
        let asIsCost = 0;
        let toBeCost = 0;
        
        let bottlenecks = 0;
        let potentialSavingTime = 0; // percentage
        let potentialSavingCost = 0; // monthly rupiah

        try {
            // Fetch project frequency to use as multiplier for cost
            const [projRows] = await pool.query('SELECT frequency FROM projects WHERE id = ?', [projectId]);
            const freq = Number(projRows[0]?.frequency || 1);

            // To calculate accurate stats, we need BOTH as-is and to-be versions.
            // If one is missing from the request body, fetch the latest one from the database.
            let finalAsIs = canvas_json ? (typeof canvas_json === 'string' ? JSON.parse(canvas_json) : canvas_json) : null;
            let finalToBe = to_be_json ? (typeof to_be_json === 'string' ? JSON.parse(to_be_json) : to_be_json) : null;

            if (!finalAsIs || !finalToBe) {
                const [rows] = await pool.query('SELECT canvas_json, to_be_json FROM process_maps WHERE project_id = ?', [projectId]);
                if (rows.length > 0) {
                    if (!finalAsIs && rows[0].canvas_json) {
                        try {
                            finalAsIs = typeof rows[0].canvas_json === 'string' ? JSON.parse(rows[0].canvas_json) : rows[0].canvas_json;
                        } catch (e) { console.error('[API Stats] Error parsing DB As-Is:', e); }
                    }
                    if (!finalToBe && rows[0].to_be_json) {
                        try {
                            finalToBe = typeof rows[0].to_be_json === 'string' ? JSON.parse(rows[0].to_be_json) : rows[0].to_be_json;
                        } catch (e) { console.error('[API Stats] Error parsing DB To-Be:', e); }
                    }
                }
            }
            
            // Helper to get total duration and cost
            const getMins = (n) => {
                const d = Number(n.data?.duration || 0);
                if (isNaN(d)) return 0;
                const unit = n.data?.durationUnit || 'menit';
                if (unit === 'jam') return d * 60;
                if (unit === 'hari') return d * 480;
                return d;
            };
            const getCost = (n) => {
                const c = Number(n.data?.cost || 0);
                return isNaN(c) ? 0 : c;
            };

            if (finalAsIs && finalAsIs.nodes) {
                const nodes = finalAsIs.nodes;
                const processNodes = nodes.filter(n => n.type === 'process');
                
                asIsSteps = processNodes.length;
                asIsTime = processNodes.reduce((sum, n) => sum + getMins(n), 0);
                // Apply frequency multiplier to total cost
                asIsCost = processNodes.reduce((sum, n) => sum + getCost(n), 0) * freq;

                // Bottleneck detection (top 20% duration)
                if (processNodes.length > 0) {
                    const durations = processNodes.map(n => getMins(n)).sort((a, b) => a - b);
                    const threshold80 = durations[Math.floor(durations.length * 0.8)] || durations[durations.length - 1];
                    bottlenecks = processNodes.filter(n => getMins(n) >= threshold80 && getMins(n) > 0).length;
                }
            }

            if (finalToBe && finalToBe.nodes) {
                const toBeNodes = finalToBe.nodes.filter(n => n.type === 'process');
                toBeSteps = toBeNodes.length;
                toBeTime = toBeNodes.reduce((sum, n) => sum + getMins(n), 0);
                // Apply frequency multiplier to total cost
                toBeCost = toBeNodes.reduce((sum, n) => sum + getCost(n), 0) * freq;
            }

            // Calculations for display summary
            if (asIsTime > 0) {
                potentialSavingTime = Math.max(0, Math.round(((asIsTime - toBeTime) / asIsTime) * 100));
            }
            potentialSavingCost = Math.max(0, asIsCost - toBeCost);

        } catch (e) {
            console.error('[API Save Canvas] Stats Calculation Error:', e);
        }

        // Update Project summary table
        try {
            const updateFields = [
                'total_steps = ?',
                'as_is_steps = ?',
                'to_be_steps = ?',
                'as_is_time = ?',
                'to_be_time = ?',
                'as_is_cost = ?',
                'to_be_cost = ?',
                'bottlenecks = ?',
                'potential_saving_time = ?',
                'potential_saving_cost = ?',
                'actual_cost = ?'
            ];
            const updateValues = [
                asIsSteps || 0,
                asIsSteps || 0,
                toBeSteps || 0,
                asIsTime || 0,
                toBeTime || 0,
                asIsCost || 0,
                toBeCost || 0,
                bottlenecks || 0,
                potentialSavingTime || 0,
                potentialSavingCost || 0,
                asIsCost || 0
            ];

            // Auto-move to "Analyze" if To-Be is saved
            if (to_be_json) {
                updateFields.push('status = ?');
                updateValues.push('analyzing');
            }

            updateValues.push(projectId);

            await pool.query(
                `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`,
                updateValues
            );
        } catch (projUpdateError) {
            console.error('[API Save Canvas] Project Table Update Error:', projUpdateError);
        }

        return NextResponse.json({ 
            message: 'Canvas saved and synced successfully', 
            id: mapId,
            stats: { 
                asIsSteps, 
                toBeSteps, 
                bottlenecks, 
                potentialSavingTime, 
                potentialSavingCost, 
                asIsCost, 
                toBeCost 
            } 
        });
    } catch (error) {
        console.error('[API Save Canvas] General Error:', error);
        return NextResponse.json({ 
            message: 'Internal Server Error', 
            error: error.message 
        }, { status: 500 });
    }
}
