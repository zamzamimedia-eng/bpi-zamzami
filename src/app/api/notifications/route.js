import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return null;
    
    // In this simplified setup, we fetch the first user as 'demo' if token exists
    // Ideally, token should contain user ID
    const [rows] = await pool.query('SELECT id FROM users LIMIT 1');
    return rows.length > 0 ? rows[0].id : null;
}

export async function GET() {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const [rows] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
            [userId]
        );
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request) {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        await pool.query(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return NextResponse.json({ message: 'Notification marked as read' });
    } catch (error) {
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
