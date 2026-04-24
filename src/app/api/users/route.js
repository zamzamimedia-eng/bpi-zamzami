import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { notifyAdmins } from '@/lib/notifications';

// Helper to check if requester is Admin
async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    return !!token;
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.full_name, u.role, u.created_at,
                   GROUP_CONCAT(t.name) as company_names,
                   GROUP_CONCAT(t.id) as company_ids
            FROM users u
            LEFT JOIN user_tenants ut ON u.id = ut.user_id
            LEFT JOIN tenants t ON ut.tenant_id = t.id
            GROUP BY u.id
        `);

        // Format company data
        const users = rows.map(user => ({
            ...user,
            companies: user.company_ids ? user.company_ids.split(',').map((id, index) => ({
                id: parseInt(id),
                name: user.company_names.split(',')[index]
            })) : []
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Fetch Users Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { username, password, full_name, role = 'user', tenantIds = [] } = await request.json();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, full_name, role]
        );

        const userId = result.insertId;

        // Save company associations
        if (tenantIds.length > 0) {
            const values = tenantIds.map(tenantId => [userId, tenantId, tenantId === tenantIds[0] ? 1 : 0]);
            await pool.query('INSERT INTO user_tenants (user_id, tenant_id, is_default) VALUES ?', [values]);
        }

        // Trigger notification
        await notifyAdmins({
            title: 'Pengguna Baru Terdaftar',
            description: `User ${username} (${full_name}) telah didaftarkan sebagai ${role}.`,
            type: 'info'
        });

        return NextResponse.json({ 
            id: userId, 
            username, 
            full_name, 
            role,
            message: 'User berhasil dibuat' 
        });
    } catch (error) {
        console.error('Create User Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'Username sudah digunakan' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
