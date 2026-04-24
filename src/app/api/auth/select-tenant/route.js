import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function POST(request) {
    try {
        const { tenantId } = await request.json();
        const cookieStore = await cookies();
        const userId = cookieStore.get('auth_token')?.value;

        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Verify if user belongs to this tenant
        const [rows] = await pool.query(
            'SELECT * FROM user_tenants WHERE user_id = ? AND tenant_id = ?',
            [userId, tenantId]
        );

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Access Denied to this Workspace' }, { status: 403 });
        }

        // Set Selected Tenant Cookie
        cookieStore.set('selected_tenant_id', tenantId.toString(), {
            httpOnly: false, // Allow client to read for UI if needed
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/'
        });

        return NextResponse.json({ message: 'Selected Tenant Updated', tenantId });

    } catch (error) {
        console.error('Tenant Selection Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
