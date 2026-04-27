import pool from './db';

export async function createNotification({ userId, title, description, type = 'info' }) {
    try {
        await pool.query(
            'INSERT INTO notifications (user_id, title, description, type) VALUES (?, ?, ?, ?)',
            [userId, title, description, type]
        );
        return true;
    } catch (error) {
        console.error('Create notification error:', error);
        return false;
    }
}

export async function notifyAdmins({ title, description, type = 'info' }) {
    try {
        const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
        for (const admin of admins) {
            await createNotification({ userId: admin.id, title, description, type });
        }
        return true;
    } catch (error) {
        console.error('Notify admins error:', error);
        return false;
    }
}
