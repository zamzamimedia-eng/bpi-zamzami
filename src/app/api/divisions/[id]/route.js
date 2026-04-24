import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuthorizedContext } from '@/lib/auth';
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
        const { name, description } = await request.json();

        if (!name) {
            return NextResponse.json({ message: 'Nama divisi wajib diisi' }, { status: 400 });
        }

        // Cek owner
        const [divs] = await pool.query('SELECT tenant_id FROM divisions WHERE id = ?', [id]);
        if (divs.length === 0) return NextResponse.json({ message: 'Division not found' }, { status: 404 });

        const context = await getAuthorizedContext(request, divs[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        await pool.query(
            'UPDATE divisions SET name = ?, description = ? WHERE id = ?',
            [name, description, id]
        );

        return NextResponse.json({ message: 'Divisi berhasil diupdate' });
    } catch (error) {
        console.error('Update Division Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ message: 'Divisi dengan nama ini sudah ada di perusahaan tersebut' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params;
    try {
        // Cek owner
        const [divs] = await pool.query('SELECT tenant_id FROM divisions WHERE id = ?', [id]);
        if (divs.length === 0) return NextResponse.json({ message: 'Division not found' }, { status: 404 });

        const context = await getAuthorizedContext(request, divs[0].tenant_id);
        if (!context) return NextResponse.json({ message: 'Akses Ditolak' }, { status: 403 });

        await pool.query('DELETE FROM divisions WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Divisi berhasil dihapus' });
    } catch (error) {
        console.error('Delete Division Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
