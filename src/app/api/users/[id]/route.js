import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    return !!token;
}

export async function PUT(request, { params }) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        const body = await request.json();
        const { username, password, full_name, role, profile_photo, tenantIds } = body;

        const updates = [];
        const values = [];

        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }
        if (full_name !== undefined) {
            updates.push('full_name = ?');
            values.push(full_name);
        }
        if (role !== undefined) {
            updates.push('role = ?');
            values.push(role);
        }
        if (profile_photo !== undefined) {
            updates.push('profile_photo = ?');
            values.push(profile_photo);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length > 0) {
            values.push(id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        // Sync company associations ONLY if tenantIds is explicitly provided in the request
        if (tenantIds !== undefined) {
            // 1. Remove old ones
            await pool.query('DELETE FROM user_tenants WHERE user_id = ?', [id]);
            
            // 2. Add new ones
            if (tenantIds.length > 0) {
                const utValues = tenantIds.map(tenantId => [id, tenantId, tenantId === tenantIds[0] ? 1 : 0]);
                await pool.query('INSERT INTO user_tenants (user_id, tenant_id, is_default) VALUES ?', [utValues]);
            }
        }

        return NextResponse.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Update User Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'Username sudah digunakan' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
