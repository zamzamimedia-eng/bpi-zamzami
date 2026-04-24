import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/rca?processMapId=X — Get all RCA entries for a process map
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const processMapId = searchParams.get('processMapId');

    if (!processMapId) {
        return NextResponse.json({ message: 'processMapId is required' }, { status: 400 });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM root_cause_analysis WHERE process_map_id = ? ORDER BY created_at ASC',
            [processMapId]
        );

        // Convert to a map keyed by node_id for easy frontend use
        const rcaMap = {};
        rows.forEach(row => {
            rcaMap[row.node_id] = {
                id: row.id,
                problemStatement: row.problem_statement || '',
                whys: [row.why_1, row.why_2, row.why_3, row.why_4, row.why_5].map(w => w || ''),
            };
        });

        return NextResponse.json(rcaMap);
    } catch (error) {
        console.error('GET RCA Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/rca — Save/update RCA data for a node
export async function POST(request) {
    try {
        const { processMapId, nodeId, problemStatement, whys } = await request.json();

        if (!processMapId || !nodeId) {
            return NextResponse.json({ message: 'processMapId and nodeId are required' }, { status: 400 });
        }

        const [why1, why2, why3, why4, why5] = whys || ['', '', '', '', ''];

        // UPSERT: insert or update
        await pool.query(
            `INSERT INTO root_cause_analysis (process_map_id, node_id, problem_statement, why_1, why_2, why_3, why_4, why_5)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                problem_statement = ?,
                why_1 = ?,
                why_2 = ?,
                why_3 = ?,
                why_4 = ?,
                why_5 = ?`,
            [
                processMapId, nodeId, problemStatement || '', why1, why2, why3, why4, why5,
                problemStatement || '', why1, why2, why3, why4, why5
            ]
        );

        return NextResponse.json({ message: 'RCA saved successfully' });
    } catch (error) {
        console.error('POST RCA Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/rca — Delete RCA for a specific node
export async function DELETE(request) {
    try {
        const { processMapId, nodeId } = await request.json();

        if (!processMapId || !nodeId) {
            return NextResponse.json({ message: 'processMapId and nodeId are required' }, { status: 400 });
        }

        await pool.query(
            'DELETE FROM root_cause_analysis WHERE process_map_id = ? AND node_id = ?',
            [processMapId, nodeId]
        );

        return NextResponse.json({ message: 'RCA deleted successfully' });
    } catch (error) {
        console.error('DELETE RCA Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
