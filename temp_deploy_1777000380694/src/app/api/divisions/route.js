import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const context = await getAuthorizedContext(request, searchParams.get('tenant_id'));

    if (!context) {
        return NextResponse.json({ message: 'Akses Ditolak (Unauthorized)' }, { status: 403 });
    }

    const { user, tenantId } = context;
    const requestedTenantId = searchParams.get('tenant_id');

    try {
        let query = 'SELECT d.*, t.name as tenant_name FROM divisions d JOIN tenants t ON d.tenant_id = t.id WHERE d.tenant_id = ? ORDER BY d.name ASC';
        let params = [tenantId];

        // If user is admin and hasn't requested a specific tenant, show ALL divisions from ALL their authorized tenants
        if (user.role === 'admin' && !requestedTenantId) {
            query = `
                SELECT d.*, t.name as tenant_name FROM divisions d 
                JOIN tenants t ON d.tenant_id = t.id 
                WHERE d.tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = ?) 
                ORDER BY t.name ASC, d.name ASC`;
            params = [user.id];
        }

        const [rows] = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Fetch Divisions Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { tenant_id, name, description = '' } = await request.json();
        
        const context = await getAuthorizedContext(request, tenant_id);
        if (!context) {
            return NextResponse.json({ message: 'Akses Ditolak (Unauthorized)' }, { status: 403 });
        }

        const { tenantId } = context;

        if (!name) {
            return NextResponse.json({ message: 'Nama divisi wajib diisi' }, { status: 400 });
        }

        const [result] = await pool.query(
            'INSERT INTO divisions (tenant_id, name, description) VALUES (?, ?, ?)',
            [tenantId, name, description]
        );

        return NextResponse.json({
            id: result.insertId,
            tenant_id: tenantId,
            name,
            description,
            message: 'Divisi berhasil ditambahkan'
        });
    } catch (error) {
        console.error('Create Division Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'Divisi dengan nama ini sudah ada' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
