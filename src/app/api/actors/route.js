import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';

// GET /api/actors — Get all actors for the current tenant
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const context = await getAuthorizedContext(request, searchParams.get('tenantId'));
    
    if (!context) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const { tenantId } = context;
    
    try {
        const [rows] = await pool.query(
            'SELECT * FROM actors WHERE tenant_id = ? ORDER BY name ASC',
            [tenantId]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('GET Actors Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/actors — Create a new actor
export async function POST(request) {
    try {
        const body = await request.json();
        const { name, role, email, phone, tenant_id } = body;
        
        const context = await getAuthorizedContext(request, tenant_id);
        if (!context) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { tenantId } = context;

        if (!name) {
            return NextResponse.json({ message: 'Name is required' }, { status: 400 });
        }

        const [result] = await pool.query(
            'INSERT INTO actors (tenant_id, name, role, email, phone) VALUES (?, ?, ?, ?, ?)',
            [tenantId, name, role || '', email || '', phone || '']
        );

        return NextResponse.json({ 
            id: result.insertId, 
            tenant_id: tenantId, 
            name, role, email, phone 
        });
    } catch (error) {
        console.error('POST Actors Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/actors — Update an actor
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, name, role, email, phone, tenant_id } = body;
        
        const context = await getAuthorizedContext(request, tenant_id);
        if (!context) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { tenantId } = context;

        if (!id || !name) {
            return NextResponse.json({ message: 'ID and Name are required' }, { status: 400 });
        }

        await pool.query(
            'UPDATE actors SET name = ?, role = ?, email = ?, phone = ? WHERE id = ? AND tenant_id = ?',
            [name, role || '', email || '', phone || '', id, tenantId]
        );

        return NextResponse.json({ message: 'Actor updated successfully' });
    } catch (error) {
        console.error('PUT Actors Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/actors — Delete an actor
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const tenant_id = searchParams.get('tenantId');
        
        const context = await getAuthorizedContext(request, tenant_id);
        if (!context) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        
        const { tenantId } = context;

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        await pool.query(
            'DELETE FROM actors WHERE id = ? AND tenant_id = ?',
            [id, tenantId]
        );

        return NextResponse.json({ message: 'Actor deleted successfully' });
    } catch (error) {
        console.error('DELETE Actors Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
