const pool = require('./src/lib/db').default || require('./src/lib/db');
const fs = require('fs');
const path = require('path');

async function check() {
    try {
        console.log('--- Database Check ---');
        const [rows] = await pool.query('SELECT id, username, profile_photo FROM users');
        console.log(JSON.stringify(rows, null, 2));

        console.log('\n--- Filesystem Check ---');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
        if (fs.existsSync(uploadDir)) {
            const files = fs.readdirSync(uploadDir);
            console.log(`Directory: ${uploadDir}`);
            console.log(`Files count: ${files.length}`);
            console.log('Files:', files);
        } else {
            console.log(`Directory not found: ${uploadDir}`);
        }
    } catch (e) {
        console.error('Check failed:', e);
    }
    process.exit(0);
}
check();
