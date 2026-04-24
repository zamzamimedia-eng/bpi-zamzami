import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT 1 as ok');
        return NextResponse.json({ 
            status: 'ok', 
            message: 'Database connection successful!',
            data: rows,
            env: {
                has_user: !!process.env.DB_USER,
                has_pass: !!process.env.DB_PASSWORD,
                has_socket: !!process.env.DB_SOCKET,
                socket_path: process.env.DB_SOCKET
            }
        });
    } catch (error) {
        console.error('DB Test Error:', error);
        return NextResponse.json({ 
            status: 'error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
