import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // Cari user di database
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 401 });
        }

        const user = rows[0];

        // Cek password dengan bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        
        // Fallback untuk password plain-text (admin123) yang diinput manual awal
        if (!isMatch && password !== user.password) {
            return NextResponse.json({ message: 'Password salah' }, { status: 401 });
        }

        // Set Cookie (Sederhana untuk demo)
        const cookieStore = await cookies();
        cookieStore.set('auth_token', user.id.toString(), { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 hari
            path: '/'
        });

        // Fetch companies associated with this user
        const [companies] = await pool.query(
            'SELECT t.id, t.name, ut.is_default FROM tenants t ' +
            'JOIN user_tenants ut ON t.id = ut.tenant_id ' +
            'WHERE ut.user_id = ?',
            [user.id]
        );

        return NextResponse.json({ 
            message: 'Login Berhasil',
            user: { 
                id: user.id, 
                username: user.username, 
                full_name: user.full_name,
                companies: companies 
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
