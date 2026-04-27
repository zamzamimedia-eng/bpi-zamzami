import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const sql = `
            CREATE TABLE IF NOT EXISTS notifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
                is_read BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `;
        await pool.query(sql);

        // Insert some dummy notifications for testing
        const [users] = await pool.query('SELECT id FROM users LIMIT 1');
        if (users.length > 0) {
            const userId = users[0].id;
            await pool.query(`
                INSERT INTO notifications (user_id, title, description, type) 
                VALUES 
                (?, 'Proyek Baru Dimulai', 'Proyek Perbaikan Alur Reimbursement telah dimulai.', 'info'),
                (?, 'Bottleneck Terdeteksi', 'Ada 3 bottleneck baru di proses pengadaan barang!', 'warning'),
                (?, 'Tugas Selesai', 'Tugas review dokumen telah diselesaikan oleh admin.', 'success')
            `, [userId, userId, userId]);
        }

        return NextResponse.json({ message: 'Notifications table created and seeded' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
