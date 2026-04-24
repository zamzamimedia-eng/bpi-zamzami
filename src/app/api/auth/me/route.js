import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import pool from '@/lib/db';

export async function GET() {
    try {
        const user = await getSessionUser();
        if (!user) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const cookieStore = await cookies();
        const selectedTenantId = cookieStore.get('selected_tenant_id')?.value;

        // Fetch user's companies (tenants)
        const [companies] = await pool.query(
            `SELECT t.id, t.name 
             FROM tenants t
             JOIN user_tenants ut ON t.id = ut.tenant_id
             WHERE ut.user_id = ?`,
            [user.id]
        );

        // Return a flat structure for backward compatibility
        return NextResponse.json({ 
            ...user,
            authenticated: true,
            selectedTenantId: selectedTenantId || null,
            companies: companies || []
        });
    } catch (error) {
        console.error('Auth Me Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
