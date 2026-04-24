import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    return !!token;
}

export async function GET() {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const [rows] = await pool.query('SELECT * FROM tenants ORDER BY name ASC');
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await isAdmin()) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { name } = await request.json();

        const [result] = await pool.query(
            'INSERT INTO tenants (name) VALUES (?)',
            [name]
        );

        return NextResponse.json({ 
            id: result.insertId, 
            name, 
            message: 'Perusahaan berhasil ditambahkan' 
        });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
