import { cookies } from 'next/headers';
import pool from './db';

/**
 * Mendapatkan data user dari cookie auth_token
 */
export async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) return null;

    try {
        const [rows] = await pool.query(
            'SELECT id, username, full_name, role FROM users WHERE id = ?',
            [token.value]
        );
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        console.error('Auth Error:', error);
        return null;
    }
}

/**
 * Memastikan user memiliki akses ke tenant_id tertentu
 */
export async function verifyTenantAccess(userId, tenantId) {
    if (!userId || !tenantId) return false;

    try {
        const [rows] = await pool.query(
            'SELECT 1 FROM user_tenants WHERE user_id = ? AND tenant_id = ?',
            [userId, tenantId]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Verify Access Error:', error);
        return false;
    }
}

/**
 * Helper untuk validasi multi-tenancy di level API
 * Returns { user, authorizedTenantId } atau null jika tidak valid
 */
export async function getAuthorizedContext(request, targetTenantId = null) {
    const user = await getSessionUser();
    if (!user) return null;

    const cookieStore = await cookies();
    let sessionTenantId = targetTenantId || cookieStore.get('selected_tenant_id')?.value;
    
    // Fallback: If no tenant is selected, use the user's default allowed tenant
    if (!sessionTenantId) {
        try {
            const [rows] = await pool.query(
                'SELECT tenant_id FROM user_tenants WHERE user_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1',
                [user.id]
            );
            if (rows.length > 0) {
                sessionTenantId = rows[0].tenant_id;
            }
        } catch (err) {
            console.error('Fallback Tenant Lookup Error:', err);
        }
    }

    if (!sessionTenantId) return null;

    const isAuthorized = await verifyTenantAccess(user.id, sessionTenantId);
    
    if (!isAuthorized) return null;

    return { user, tenantId: sessionTenantId };
}
