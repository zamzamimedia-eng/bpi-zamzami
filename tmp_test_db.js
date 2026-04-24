const pool = require('./src/lib/db').default;

async function test() {
    try {
        const id = 1;
        const username = 'admin';
        const full_name = 'BPI Admin Verified TEST';
        const role = 'admin';
        const profile_photo = '/uploads/avatars/test.png';

        let query = 'UPDATE users SET username = ?, full_name = ?, role = ?, profile_photo = ? WHERE id = ?';
        let values = [username, full_name, role, profile_photo, id];

        const [result] = await pool.query(query, values);
        console.log('Update result:', result);

        const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        console.log('User after update:', rows[0]);

        process.exit(0);
    } catch (error) {
        console.error('Test error:', error);
        process.exit(1);
    }
}

test();
