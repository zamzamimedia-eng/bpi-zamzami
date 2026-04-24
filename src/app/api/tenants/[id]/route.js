import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    return !!token;
}

export async function PUT(request, { params }) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        const { name } = await request.json();

        await pool.query(
            'UPDATE tenants SET name = ? WHERE id = ?',
            [name, id]
        );

        return NextResponse.json({ message: 'Perusahaan berhasil diupdate' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    try {
        await pool.query('DELETE FROM tenants WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Perusahaan berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
